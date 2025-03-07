# Install

## **Prerequisites**
Before setting up **Aqui**, ensure you have the following installed:
- [Visual Studio Code](https://code.visualstudio.com/) (VS Code)
- [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- [Node.js](https://nodejs.org/) (optional, if using `live-server` via npm)

## **1. Clone the Repository**
To get started, clone the repository and navigate into the project directory:

```sh
git clone https://github.com/EmreDay1/Aqui.git
cd Aqui
```

## **2. Install Live Server**
### **Option 1: Using VS Code Extension**
1. Open **VS Code**.
2. Go to **Extensions** (`Ctrl + Shift + X` or `Cmd + Shift + X` on macOS).
3. Search for **Live Server** and install it.

### **Option 2: Using npm**
If you prefer a command-line setup, install **Live Server** globally via **npm**:

```sh
npm install -g live-server
```

## **3. Start Live Server**
### **Option 1: Using VS Code**
- Open the `Aqui` project in VS Code.
- Right-click `index.html` and select **"Open with Live Server"**.
- This will launch the application in your default browser.

### **Option 2: Using Terminal**
If you installed `live-server` globally, navigate to the project folder and run:

```sh
live-server
```

By default, the application will be accessible at:
```
http://127.0.0.1:5500
```

## **4. Explore Aqui**
- The **code editor** and **visualization panel** will load in your browser.
- Try writing some **Aqui** code in the editor and click **Run** to generate graphics.
- Check the **AST** and **Error Panel** for debugging.

## **5. Troubleshooting**
- If `live-server` does not start, check if another process is using port **5500**.
- Open the browser console (`F12` or `Ctrl + Shift + I`) to debug issues.
- If errors persist, reinstall **Live Server** or use an alternative local server.
