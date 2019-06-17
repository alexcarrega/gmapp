# GMApp (Gmail App for Desktop)

### **It is not an official application of Google Inc.**

Build your own custom client for Gmail.
This is created with [Electron](https://electronjs.org/) v4.

## How to use

Clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
git clone https://github.com/alexcarrega/gmapp
cd gmapp
npm install
npm start
```

## Create Linux executable file

### 64 bit version

```bash
npm run build-linux64
```

### 32 bit version

```bash
npm run build-linux32
```

This command will create a folder called **gmapp-linux-x64** (**gmapp-linux-x32**) that contains the executable file. Now you have to include this file as a startup application of your Linux operating system 

## NOTE

If it is not already installed, you have to include electron-packager for creating the linux executable file with the following command: 

```bash
npm install electron-packager
```
