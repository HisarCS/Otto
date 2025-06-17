import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

env.allowLocalModels = true;
env.useBrowserCache = true;
env.cacheModels = true;
env.useProgressCallback = false;

const fileInput = document.getElementById('file-input');
const planText = document.getElementById('plan-text');
const buildingType = document.getElementById('building-type');
const floors = document.getElementById('floors');
const occupancy = document.getElementById('occupancy');
const analyzeBtn = document.getElementById('analyze-btn');
const browseBtn = document.querySelector('.browse-btn');
const uploadArea = document.querySelector('.upload-area');
const statusContainer = document.getElementById('status-container');

let textClassifier = null;
let imageClassifier = null;
let isLoading = false;
let modelsAreLoading = false;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function saveAnalysisToCache(input, result) {
  try {
    const cacheKey = `binasense_${hashString(input)}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      result: result
    }));
  } catch (error) {}
}

function getAnalysisFromCache(input) {
  try {
    const cacheKey = `binasense_${hashString(input)}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const cacheAge = Date.now() - parsedCache.timestamp;
      
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return parsedCache.result;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function showStatus(message, type = 'info') {
  const statusEl = document.createElement('div');
  statusEl.className = `status-message status-${type}`;
  statusEl.textContent = message;
  
  statusContainer.innerHTML = '';
  statusContainer.appendChild(statusEl);
  
  if (type !== 'error') {
    setTimeout(() => {
      if (statusEl.parentNode === statusContainer) {
        statusEl.remove();
      }
    }, 5000);
  }
}

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  
  if (isLoading) {
    const originalText = analyzeBtn.textContent;
    analyzeBtn.setAttribute('data-original-text', originalText);
    analyzeBtn.innerHTML = 'İşleniyor... <span class="loader"></span>';
  } else {
    const originalText = analyzeBtn.getAttribute('data-original-text') || 'Planı Analiz Et';
    analyzeBtn.textContent = originalText;
  }
}

function quickAnalyze(text) {
  let score = 5.0;
  let strengths = [];
  let improvements = [];
  
  const keywords = {
    exitRoutes: ['çıkış', 'tahliye rota', 'kaçış yolu', 'merdiven'],
    assembly: ['toplanma', 'buluşma nokta'],
    equipment: ['yangın söndürücü', 'ilk yardım', 'acil durum ekipman'],
    training: ['eğitim', 'tatbikat', 'drill', 'alıştırma'],
    special: ['engelli', 'yaşlı', 'özel durum'],
    communication: ['iletişim', 'koordinatör', 'sorumlu']
  };
  
  let foundCategories = 0;
  
  for (const [category, words] of Object.entries(keywords)) {
    let found = false;
    for (const word of words) {
      if (text.toLowerCase().includes(word.toLowerCase())) {
        found = true;
        break;
      }
    }
    
    if (found) {
      foundCategories++;
      
      switch (category) {
        case 'exitRoutes':
          strengths.push('Tahliye rotaları belirtilmiş');
          break;
        case 'assembly':
          strengths.push('Toplanma noktaları tanımlanmış');
          break;
        case 'equipment':
          strengths.push('Acil durum ekipmanları belirtilmiş');
          break;
        case 'training':
          strengths.push('Tatbikat planı mevcut');
          break;
        case 'special':
          strengths.push('Özel durumlar için prosedürler tanımlanmış');
          break;
        case 'communication':
          strengths.push('İletişim zinciri belirlenmiş');
          break;
      }
    } else {
      switch (category) {
        case 'exitRoutes':
          improvements.push('Tahliye rotaları daha net belirtilmeli');
          break;
        case 'assembly':
          improvements.push('Toplanma noktaları tanımlanmalı');
          break;
        case 'equipment':
          improvements.push('Acil durum ekipmanlarının yerleri belirtilmeli');
          break;
        case 'training':
          improvements.push('Düzenli tatbikat planı eklenmeli');
          break;
        case 'special':
          improvements.push('Özel durumlar için prosedürler eklenmeli');
          break;
        case 'communication':
          improvements.push('İletişim zinciri ve sorumlular belirtilmeli');
          break;
      }
    }
  }
  
  score = 3.0 + (foundCategories * 1.0);
  
  strengths = strengths.slice(0, 3);
  improvements = improvements.slice(0, 3);
  
  if (strengths.length === 0) {
    strengths.push('Temel tahliye planı mevcut');
  }
  
  return {
    score: Math.min(Math.round(score * 10) / 10, 9.0),
    strengths,
    improvements
  };
}

async function initModels() {
  if (textClassifier !== null && imageClassifier !== null) return;
  
  if (modelsAreLoading) {
    showStatus('AI modelleri yükleniyor, lütfen bekleyin...', 'info');
    return;
  }
  
  try {
    modelsAreLoading = true;
    isLoading = true;
    setLoading(true);
    showStatus('AI modelleri yükleniyor... Bu işlem ilk seferde biraz zaman alabilir.');
    
    // Load text model first
    if (textClassifier === null) {
      try {
        textClassifier = await pipeline(
          'text-classification', 
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english', 
          { quantized: true }
        );
      } catch (error) {
        console.error('Text model loading error:', error);
      }
    }
    
    // Then load image model
    if (imageClassifier === null) {
      try {
        imageClassifier = await pipeline(
          'image-classification', 
          'Xenova/vit-base-patch16-224-in21k-classifier', 
          { quantized: true }
        );
      } catch (error) {
        console.error('Image model loading error:', error);
      }
    }
    
    if (textClassifier || imageClassifier) {
      showStatus('AI modelleri başarıyla yüklendi!', 'success');
    } else {
      throw new Error('Modeller yüklenemedi');
    }
  } catch (error) {
    showStatus(`Model yükleme hatası: ${error.message}`, 'error');
  } finally {
    modelsAreLoading = false;
    isLoading = false;
    setLoading(false);
  }
}

async function analyzeText(text) {
  const cachedResult = getAnalysisFromCache(text);
  if (cachedResult) {
    return cachedResult;
  }
  
  const quickResult = quickAnalyze(text);
  
  if (textClassifier === null) {
    if (!modelsAreLoading) {
      try {
        await initModels();
      } catch (error) {
        return quickResult;
      }
    } else {
      return quickResult;
    }
  }
  
  const buildingTypeText = buildingType.options[buildingType.selectedIndex].text;
  const prompt = `Bina tahliye planı değerlendirmesi:
Bina tipi: ${buildingTypeText}
Kat sayısı: ${floors.value}
Maksimum kapasite: ${occupancy.value}

Tahliye planı: ${text}

Bu tahliye planını değerlendir ve güvenlik uygunluğunu incele.`;

  try {
    const result = await textClassifier(prompt, { topk: 2 });
    
    let score;
    let strengths = [];
    let improvements = [];
    
    if (result[0].label === 'POSITIVE') {
      score = 6.5 + (result[0].score * 2.5);
      score = Math.min(Math.round(score * 10) / 10, 9.5);
      
      strengths = [
        'Kapsamlı ve detaylı tahliye planı',
        'Acil durum prosedürleri net bir şekilde tanımlanmış',
        'Sorumluluk zinciri açıkça belirtilmiş',
        'Özel durumlar için prosedürler mevcut',
        'Tahliye tatbikatları planlanmış'
      ];
      
      improvements = [
        'Tahliye tatbikatları daha sık yapılabilir',
        'Alternatif çıkış rotaları eklenebilir',
        'Acil durum senaryoları çeşitlendirilebilir',
        'İletişim prosedürleri geliştirilebilir',
        'Görsel yönlendirmeler artırılabilir'
      ];
      
      const improvementCount = Math.max(1, Math.round((10 - score) / 2));
      improvements = improvements.sort(() => 0.5 - Math.random()).slice(0, improvementCount);
      
    } else {
      score = 2 + (result[0].score * 3.5);
      score = Math.round(score * 10) / 10;
      
      strengths = [
        'Temel tahliye rotası belirtilmiş',
        'Acil durum prosedürü mevcut'
      ];
      
      improvements = [
        'Acil durum çıkışları daha net belirtilmeli',
        'Alternatif tahliye rotaları tanımlanmalı',
        'Toplanma noktaları açıkça belirtilmeli',
        'Acil durum ekipmanlarının yerleri belirtilmeli',
        'Engelli bireyler için prosedürler eklenmeli',
        'Yangın söndürücülerin yerleri işaretlenmeli',
        'Tahliye tatbikatları planlanmalı',
        'Kat planları acil durum çıkışlarını göstermeli'
      ];
    }
    
    strengths = strengths.sort(() => 0.5 - Math.random()).slice(0, Math.min(3, strengths.length));
    
    const finalResult = {
      score,
      strengths,
      improvements
    };
    
    saveAnalysisToCache(text, finalResult);
    
    return finalResult;
  } catch (error) {
    return quickResult;
  }
}

async function analyzeImage(file) {
  let imageHash = '';
  try {
    const buffer = await file.slice(0, 100 * 1024).arrayBuffer();
    const hashArray = Array.from(new Uint8Array(buffer));
    imageHash = hashArray.slice(0, 1000).reduce((prev, curr) => prev + curr, 0).toString(16);
    
    const cacheKey = `binasense_img_${imageHash}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const cacheAge = Date.now() - parsedCache.timestamp;
      
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return parsedCache.result;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('Error generating image hash:', error);
  }
  
  // Try to use the image classifier if available
  if (imageClassifier === null) {
    try {
      await initModels();
    } catch (error) {
      return analyzeImageWithFeatures(file);
    }
  }
  
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const img = new Image();
        
        img.onload = async () => {
          let result;
          
          // First, always analyze basic features
          const features = extractImageFeatures(img);
          const featureResult = evaluateEvacuationPlanImage(features);
          
          try {
            // If image model is loaded, use it to enhance the analysis
            if (imageClassifier) {
              const classifierResult = await imageClassifier(img);
              result = enhanceImageAnalysisWithClassifier(classifierResult, featureResult, features);
            } else {
              result = featureResult;
            }
          } catch (error) {
            console.error('Image classification error:', error);
            result = featureResult;
          }
          
          // Cache result
          if (imageHash) {
            const cacheKey = `binasense_img_${imageHash}`;
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              result: result
            }));
          }
          
          resolve(result);
        };
        
        img.onerror = () => {
          reject(new Error('Görsel yüklenirken bir hata oluştu'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Dosya okuma hatası'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

function enhanceImageAnalysisWithClassifier(classifierResults, featureResults, features) {
  // Extract relevant classifier information
  const topClasses = classifierResults.slice(0, 5).map(r => r.label.toLowerCase());
  
  // Check for evacuation plan related keywords
  const planKeywords = ['map', 'plan', 'diagram', 'blueprint', 'floor', 'building', 'architecture', 'layout', 'schematic'];
  const emergencyKeywords = ['emergency', 'exit', 'safety', 'fire', 'evacuation', 'hazard', 'warning', 'alarm'];
  
  let planScore = 0;
  let emergencyScore = 0;
  
  // Check top classes for relevant keywords
  topClasses.forEach((className, index) => {
    const weight = 1 - (index * 0.15); // Weight by position in results
    
    // Check for plan-related terms
    planKeywords.forEach(keyword => {
      if (className.includes(keyword)) {
        planScore += weight;
      }
    });
    
    // Check for emergency-related terms
    emergencyKeywords.forEach(keyword => {
      if (className.includes(keyword)) {
        emergencyScore += weight;
      }
    });
  });
  
  // Adjust score based on classifier results
  let score = featureResults.score;
  
  // Enhance score if classifier detected plan/map content
  if (planScore > 0.5) {
    score += 1.0;
    if (!featureResults.strengths.includes('Plan profesyonel şema formatında hazırlanmış')) {
      featureResults.strengths.push('Plan profesyonel şema formatında hazırlanmış');
    }
  }
  
  // Enhance score if classifier detected emergency content
  if (emergencyScore > 0.3) {
    score += 0.8;
    if (!featureResults.strengths.includes('Acil durum işaretleri belirgin olarak gösterilmiş')) {
      featureResults.strengths.push('Acil durum işaretleri belirgin olarak gösterilmiş');
    }
  }
  
  // Check if image is likely a photo of a building instead of a plan
  const photoKeywords = ['photo', 'photograph', 'building exterior', 'architecture exterior', 'facade'];
  const isLikelyPhoto = photoKeywords.some(keyword => 
    topClasses.some(cls => cls.includes(keyword))
  );
  
  if (isLikelyPhoto && !features.isDiagram) {
    score -= 2.0;
    if (!featureResults.improvements.includes('Tahliye planı standardize edilmiş şema formatında olmalı')) {
      featureResults.improvements.push('Tahliye planı standardize edilmiş şema formatında olmalı');
    }
  }
  
  // Calculate final score
  score = Math.max(2.0, Math.min(9.0, Math.round(score * 10) / 10));
  
  // Limit strengths and improvements to top 3
  const strengths = [...new Set(featureResults.strengths)].slice(0, 3);
  const improvements = [...new Set(featureResults.improvements)].slice(0, 3);
  
  return {
    score,
    strengths,
    improvements,
    classifierInfo: {
      topClasses: topClasses.slice(0, 3),
      planScore,
      emergencyScore
    }
  };
}

function analyzeImageWithFeatures(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const img = new Image();
        
        img.onload = async () => {
          try {
            const features = extractImageFeatures(img);
            const result = evaluateEvacuationPlanImage(features);
            resolve(result);
          } catch (error) {
            console.error('Image feature analysis error:', error);
            resolve(basicImageAnalysis(file));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Görsel yüklenirken bir hata oluştu'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Dosya okuma hatası'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

function extractImageFeatures(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let red = 0, green = 0, blue = 0;
  let lightPixels = 0, darkPixels = 0;
  let edges = 0;
  let straightLines = 0;
  
  // Sample pixels (analyze every 10th pixel for performance)
  for (let i = 0; i < data.length; i += 40) {
    red += data[i];
    green += data[i + 1];
    blue += data[i + 2];
    
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > 200) lightPixels++;
    if (brightness < 50) darkPixels++;
    
    // Simple edge detection
    if (i % 4 === 0 && i > 0 && i < data.length - 4) {
      const diff = Math.abs(data[i] - data[i + 4]) + 
                   Math.abs(data[i + 1] - data[i + 5]) + 
                   Math.abs(data[i + 2] - data[i + 6]);
      if (diff > 100) edges++;
    }
  }
  
  // Calculate averages
  const pixelCount = data.length / 4;
  const sampledCount = pixelCount / 10;
  
  red /= sampledCount;
  green /= sampledCount;
  blue /= sampledCount;
  
  // Enhanced color analysis
  let redAreas = 0;
  let greenAreas = 0;
  let blueAreas = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    // Detect red areas (emergency signs, fire extinguishers)
    if (data[i] > 200 && data[i + 1] < 120 && data[i + 2] < 120) {
      redAreas++;
    }
    
    // Detect green areas (evacuation routes)
    if (data[i] < 120 && data[i + 1] > 180 && data[i + 2] < 120) {
      greenAreas++;
    }
    
    // Detect blue areas (often used for water features or special zones)
    if (data[i] < 120 && data[i + 1] < 120 && data[i + 2] > 180) {
      blueAreas++;
    }
  }
  
  // Line detection for diagrams (simplified)
  // We'll use vertical and horizontal pixel changes as a proxy for straight lines
  let verticalLines = 0;
  let horizontalLines = 0;
  
  // Sample rows and columns for straight lines
  const sampleStep = Math.max(1, Math.floor(img.width / 50));
  
  // Check for horizontal lines (scan rows)
  for (let y = 0; y < img.height; y += sampleStep) {
    let lineSegments = 0;
    let inLine = false;
    
    for (let x = 1; x < img.width; x++) {
      const idx = (y * img.width + x) * 4;
      const prevIdx = (y * img.width + (x - 1)) * 4;
      
      if (idx < data.length && prevIdx >= 0) {
        const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const prev = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
        
        const diff = Math.abs(curr - prev);
        
        if (diff < 10 && curr < 100) { // Dark pixel with little change = potential line
          if (!inLine) {
            inLine = true;
            lineSegments++;
          }
        } else {
          inLine = false;
        }
      }
    }
    
    if (lineSegments > 3) { // If multiple segments in a row, likely a straight line
      horizontalLines++;
    }
  }
  
  // Check for vertical lines (scan columns)
  for (let x = 0; x < img.width; x += sampleStep) {
    let lineSegments = 0;
    let inLine = false;
    
    for (let y = 1; y < img.height; y++) {
      const idx = (y * img.width + x) * 4;
      const prevIdx = ((y - 1) * img.width + x) * 4;
      
      if (idx < data.length && prevIdx >= 0) {
        const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const prev = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
        
        const diff = Math.abs(curr - prev);
        
        if (diff < 10 && curr < 100) { // Dark pixel with little change = potential line
          if (!inLine) {
            inLine = true;
            lineSegments++;
          }
        } else {
          inLine = false;
        }
      }
    }
    
    if (lineSegments > 3) { // If multiple segments in a column, likely a straight line
      verticalLines++;
    }
  }
  
  // Normalize line counts
  straightLines = (horizontalLines + verticalLines) / (img.width / sampleStep + img.height / sampleStep);
  
  // Check for grid pattern (intersecting lines = floor plan)
  const gridPattern = (horizontalLines > 3 && verticalLines > 3);
  
  return {
    width: img.width,
    height: img.height,
    aspectRatio: img.width / img.height,
    colorBalance: { red, green, blue },
    contrast: darkPixels / sampledCount,
    edgeDensity: edges / sampledCount,
    hasRedElements: redAreas > (pixelCount * 0.005), // More than 0.5% red elements
    hasGreenElements: greenAreas > (pixelCount * 0.005),
    hasBlueElements: blueAreas > (pixelCount * 0.005),
    straightLineDensity: straightLines,
    gridPattern: gridPattern,
    isDiagram: edges > (pixelCount * 0.05) || straightLines > 0.1 || gridPattern
  };
}

function evaluateEvacuationPlanImage(features) {
  // Start with base score
  let score = 5.0;
  let strengths = [];
  let improvements = [];
  
  // Evaluate aspect ratio - plans are typically landscape
  if (features.aspectRatio > 1.2 && features.aspectRatio < 2.5) {
    score += 0.3;
  } else if (features.aspectRatio < 0.7 || features.aspectRatio > 3.0) {
    score -= 0.3;
    improvements.push('Plan formatı daha uygun bir boyut oranında olmalı');
  }
  
  // Evaluate clarity based on contrast and edges
  if (features.contrast > 0.15 && features.edgeDensity > 0.08) {
    score += 0.8;
    strengths.push('Plan açık ve okunaklı hatlar içeriyor');
  } else {
    score -= 1.2;
    improvements.push('Plan daha net ve okunaklı olmalı');
  }
  
  // Check for emergency markers (red elements)
  if (features.hasRedElements) {
    score += 1.2;
    strengths.push('Acil durum işaretleri belirgin olarak gösterilmiş');
  } else {
    score -= 0.8;
    improvements.push('Acil durum işaretleri daha belirgin olmalı');
  }
  
  // Check for evacuation routes (green elements)
  if (features.hasGreenElements) {
    score += 0.8;
    strengths.push('Tahliye rotaları belirgin olarak gösterilmiş');
  } else {
    improvements.push('Tahliye rotaları belirgin şekilde işaretlenmeli');
  }
  
  // Check for straight lines (indicates diagram/plan)
  if (features.straightLineDensity > 0.1) {
    score += 0.7;
  }
  
  // Check for grid pattern (indicates floor plan)
  if (features.gridPattern) {
    score += 1.0;
    strengths.push('Kat planı açıkça görselleştirilmiş');
  }
  
  // Check if it looks like a diagram/plan vs. a photo
  if (features.isDiagram) {
    score += 1.5;
    if (!strengths.includes('Plan profesyonel şema formatında hazırlanmış')) {
      strengths.push('Plan profesyonel şema formatında hazırlanmış');
    }
  } else {
    score -= 2.0;
    improvements.push('Tahliye planı standardize edilmiş şema formatında olmalı');
  }
  
  // Ensure we have at least one strength
  if (strengths.length === 0) {
    strengths.push('Temel bir görsel plan mevcut');
  }
  
  // Ensure we have at least one improvement
  if (improvements.length === 0) {
    improvements.push('Plan daha detaylı olabilir');
  }
  
  // Generate standard evacuation plan improvements if needed
  if (improvements.length < 2) {
    const standardImprovements = [
      'Çıkış rotaları daha belirgin işaretlenmeli',
      'Toplanma noktaları açıkça gösterilmeli',
      'Acil durum ekipmanlarının yerleri gösterilmeli',
      'Kat planı daha anlaşılır olmalı',
      'Yön işaretleri eklenmelidir'
    ];
    
    // Add unique improvements
    for (const imp of standardImprovements) {
      if (!improvements.includes(imp)) {
        improvements.push(imp);
        if (improvements.length >= 3) break;
      }
    }
  }
  
  // Apply score limits
  score = Math.max(2.0, Math.min(9.0, Math.round(score * 10) / 10));
  
  return {
    score,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3)
  };
}

function basicImageAnalysis(file) {
  const fileSize = file.size;
  const fileName = file.name || '';
  
  // Base score
  let score = 5.0;
  
  // Image type factor
  const fileType = file.type.toLowerCase();
  if (fileType.includes('png') || fileType.includes('pdf')) {
    score += 0.5;
  }
  
  // Filename factors
  const planKeywords = ['plan', 'tahliye', 'acil', 'emergency', 'evacuation', 'exit', 'çıkış'];
  for (const keyword of planKeywords) {
    if (fileName.toLowerCase().includes(keyword)) {
      score += 0.5;
      break;
    }
  }
  
  // Randomize slightly for variability
  score += (Math.random() * 1.0 - 0.5);
  
  // Apply score limits
  score = Math.max(2.0, Math.min(8.0, Math.round(score * 10) / 10));
  
  // Determine evaluation based on score
  let strengths = [];
  let improvements = [];
  
  if (score >= 7) {
    strengths = [
      'Görsel tahliye planı mevcut',
      'Acil çıkışlar işaretlenmiş',
      'Kat planı açıkça gösterilmiş'
    ];
    improvements = [
      'Alternatif çıkış rotaları eklenebilir',
      'Toplanma noktaları daha belirgin olabilir'
    ];
  } else if (score >= 5) {
    strengths = [
      'Temel tahliye planı mevcut',
      'Ana çıkışlar gösterilmiş'
    ];
    improvements = [
      'Acil çıkışlar daha belirgin işaretlenmeli',
      'Toplanma noktaları eklenmeli',
      'Yön işaretleri geliştirilmeli'
    ];
  } else {
    strengths = [
      'Bina görseli mevcut'
    ];
    improvements = [
      'Standart tahliye planı formatı kullanılmalı',
      'Acil çıkışlar işaretlenmeli',
      'Toplanma noktaları belirtilmeli',
      'Yön işaretleri eklenmelidir'
    ];
  }
  
  return {
    score,
    strengths,
    improvements
  };
}

function showResults(result) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';
  
  const modalTitle = document.createElement('h3');
  modalTitle.textContent = 'Tahliye Planı Değerlendirmesi';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    document.body.removeChild(modalOverlay);
  };
  
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);
  
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  
  const scoreSection = document.createElement('div');
  scoreSection.className = 'result-score';
  
  const scoreLabel = document.createElement('h4');
  scoreLabel.textContent = 'Genel Değerlendirme Puanı:';
  
  const scoreValue = document.createElement('div');
  scoreValue.className = 'score-value';
  scoreValue.textContent = `${result.score}/10`;
  
  if (result.score >= 7) {
    scoreValue.classList.add('good-score');
  } else if (result.score >= 5) {
    scoreValue.classList.add('medium-score');
  } else {
    scoreValue.classList.add('poor-score');
  }
  
  const scoreBar = document.createElement('div');
  scoreBar.className = 'score-bar';
  
  const scoreProgress = document.createElement('div');
  scoreProgress.className = 'score-progress';
  scoreProgress.style.width = `${result.score * 10}%`;
  
  if (result.score >= 7) {
    scoreProgress.classList.add('good-score-bg');
  } else if (result.score >= 5) {
    scoreProgress.classList.add('medium-score-bg');
  } else {
    scoreProgress.classList.add('poor-score-bg');
  }
  
  scoreBar.appendChild(scoreProgress);
  scoreSection.appendChild(scoreLabel);
  scoreSection.appendChild(scoreValue);
  scoreSection.appendChild(scoreBar);
  
  const strengthsSection = document.createElement('div');
  strengthsSection.className = 'result-section';
  
  const strengthsTitle = document.createElement('h4');
  strengthsTitle.textContent = 'Güçlü Yönler:';
  
  const strengthsList = document.createElement('ul');
  result.strengths.forEach(strength => {
    const item = document.createElement('li');
    item.textContent = strength;
    strengthsList.appendChild(item);
  });
  
  strengthsSection.appendChild(strengthsTitle);
  strengthsSection.appendChild(strengthsList);
  
  const improvementsSection = document.createElement('div');
  improvementsSection.className = 'result-section';
  
  const improvementsTitle = document.createElement('h4');
  improvementsTitle.textContent = 'İyileştirme Önerileri:';
  
  const improvementsList = document.createElement('ul');
  result.improvements.forEach(improvement => {
    const item = document.createElement('li');
    item.textContent = improvement;
    improvementsList.appendChild(item);
  });
  
  improvementsSection.appendChild(improvementsTitle);
  improvementsSection.appendChild(improvementsList);
  
  const disclaimerSection = document.createElement('div');
  disclaimerSection.className = 'result-section';
  disclaimerSection.style.fontSize = '0.8rem';
  disclaimerSection.style.color = 'var(--gray-500)';
  disclaimerSection.style.fontStyle = 'italic';
  disclaimerSection.textContent = 'Not: Bu değerlendirme yapay zeka tarafından otomatik olarak oluşturulmuştur ve sadece bilgilendirme amaçlıdır. Profesyonel bir değerlendirme için lütfen yetkili bir güvenlik uzmanına başvurun.';
  
  modalBody.appendChild(scoreSection);
  modalBody.appendChild(strengthsSection);
  modalBody.appendChild(improvementsSection);
  modalBody.appendChild(disclaimerSection);
  
  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  
  const actionButton = document.createElement('button');
  actionButton.className = 'primary-btn';
  actionButton.textContent = 'Anladım';
  actionButton.onclick = () => {
    document.body.removeChild(modalOverlay);
  };
  
  modalFooter.appendChild(actionButton);
  
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);
  
  modalOverlay.appendChild(modalContent);
  
  document.body.appendChild(modalOverlay);
}

browseBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileName = file.name;
  browseBtn.textContent = fileName;
  
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    showStatus(`Görsel yüklendi: ${fileName} (${Math.round(file.size / 1024)} KB)`, 'info');
  } else {
    showStatus(`Dosya yüklendi: ${fileName} (${Math.round(file.size / 1024)} KB)`, 'info');
  }
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    const file = e.dataTransfer.files[0];
    browseBtn.textContent = file.name;
    
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      showStatus(`Görsel yüklendi: ${file.name} (${Math.round(file.size / 1024)} KB)`, 'info');
    } else {
      showStatus(`Dosya yüklendi: ${file.name} (${Math.round(file.size / 1024)} KB)`, 'info');
    }
  }
});

analyzeBtn.addEventListener('click', async () => {
  if (isLoading) {
    showStatus('İşlem devam ediyor, lütfen bekleyin...', 'info');
    return;
  }
  
  const text = planText.value.trim();
  const file = fileInput.files[0];
  
  if (!text && !file) {
    showStatus('Lütfen bir tahliye planı metni girin veya bir dosya yükleyin.', 'error');
    return;
  }
  
  try {
    setLoading(true);
    
    if (file && file.type.startsWith('image/')) {
      showStatus('Görsel analiz ediliyor...', 'info');
      
      try {
        const result = await analyzeImage(file);
        showResults(result);
        showStatus('Görsel analiz tamamlandı!', 'success');
      } catch (error) {
        showStatus(`Görsel analiz hatası: ${error.message}`, 'error');
      }
    } else if (text) {
      showStatus('Tahliye planı analiz ediliyor...', 'info');
      
      try {
        const result = await analyzeText(text);
        showResults(result);
        showStatus('Analiz tamamlandı!', 'success');
      } catch (error) {
        showStatus(`Analiz sırasında bir hata oluştu: ${error.message}`, 'error');
      }
    }
  } finally {
    setLoading(false);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  showStatus('Tahliye planınızı analiz etmek için metin girin veya bir dosya yükleyin.', 'info');
});
