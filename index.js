"use strict";

const fs = require('fs')
const electron = require('electron');
const settings = require('electron-settings');
const ipc_main = electron.ipcMain;
const { app, BrowserWindow, Menu, Tray } = require('electron')
const path = require('path')
const got_the_lock = app.requestSingleInstanceLock();

var gmapp = null, tray = null, data = {
	loaded: false
};

if (!got_the_lock) {
	return app.quit()
}

app.on('second-instance', (commandLine, workingDirectory) => {
	if (gmapp.window) {
		if (gmapp.window.isMinimized()) {
			gmapp.window.restore();
		}
		gmapp.window.show();
	}
})

app.on('ready', () => {
	['show_notifications', 'close_to_tray', 'start_in_tray'].forEach((set_prop) => {
		if (!settings.has(set_prop)) {
			settings.set(set_prop, true);
		}
	});

	ipc_main.on('notification-shim', (e, msg) => {
		console.log(msg);
	});

	tray = new Tray(path.join(__dirname, 'assets/icons/icon-load.png'))
	const contextMenu = Menu.buildFromTemplate([{
			label: 'Toggle window show/hide',
			click: () => {
				if (gmapp.isVisible()) {
					gmapp.hide();
				} else {
					gmapp.show();
				}
			}
		}, {
			label: 'Show notifications',
			type: 'checkbox',
			checked: settings.get('show_notifications'),
			click: (menu_item) => {
				settings.set('show_notifications', menu_item.checked);
			}
		}, {
			label: 'Close to tray',
			type: 'checkbox',
			checked: settings.get('close_to_tray'),
			click: (menu_item) => {
				settings.set('close_to_tray', menu_item.checked);
			}
		}, {
			label: 'Start in tray',
			type: 'checkbox',
			checked: settings.get('start_in_tray'),
			click: (menu_item) => {
				settings.set('start_in_tray', menu_item.checked);
			}
      }, {
         label: 'Swow Development Tools',
         type: 'checkbox',
         checked: settings.get('show_dev_tools'),
         click: (menu_item) => {
            settings.set('show_dev_tools', menu_item.checked);
            if (menu_item.checked) {
               gmapp.openDevTools();
            } else {
               gmapp.closeDevTools();
            }
         }
      }, {
			label: 'Quit',
			click: () => {
				app.isQuiting = true;
				app.quit();
			}
		}
	])
	tray.setToolTip('Gmapp')
	tray.setContextMenu(contextMenu)
	tray.on("double-click", function(event){
		gmapp.show();
	})
})

app.on('ready', createWindow)

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	if (gmapp === null) {
		createWindow()
	}
})

global.osLinux = function (callback) {
	if (process.platform === 'linux') {
		return Function.bind.apply(callback, this, [].slice.call(arguments, 0));
	}
	return function () { };
}

function createWindow() {
	var mainScreen = electron.screen.getPrimaryDisplay();
	var dims = mainScreen.workAreaSize;

	gmapp = new BrowserWindow({
		backgroundColor: '#2c2c2c',
		title: "GMail",
		width: dims.width * .8,
		height: dims.height * .8,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'browser.js')
		},
		icon: path.join(__dirname, 'assets/icons/icon-load.png'),
		show: !settings.get('start_in_tray')
	})

	gmapp.setMenuBarVisibility(false);

	gmapp.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)  Chrome/73.0.3683.86 Safari/537.36")
	gmapp.loadURL("https://www.gmail.com");

   gmapp.on('page-title-updated', osLinux((event, title) => {
		var msg_count = title.match(/\((\d+)\)/);
		msg_count = msg_count ? msg_count[1] : '';
		data.msg_count = parseInt(msg_count);
		if (data.msg_count > 0) {
			tray.setImage(path.join(__dirname, 'assets/icons/icon-mail.png'));
			gmapp.setIcon(path.join(__dirname, 'assets/icons/icon-mail.png'));
		} else {
			if (data.content_loaded) {
				tray.setImage(path.join(__dirname, 'assets/icons/icon.png'));
				gmapp.setIcon(path.join(__dirname, 'assets/icons/icon.png'));
			} else {
				tray.setImage(path.join(__dirname, 'assets/icons/icon-load.png'));
				gmapp.setIcon(path.join(__dirname, 'assets/icons/icon-load.png'));
			}
		}
	}))

	gmapp.on('close', function (event) {
	    if(!app.isQuiting && settings.get('close_to_tray')){
			event.preventDefault();
			gmapp.hide();
		}
		return !settings.get('close_to_tray');
	})

	gmapp.on('closed', function (event) {
		gmapp = null;
	})

	gmapp.webContents.on('dom-ready', function (e) {
		let js_content = fs.readFileSync(path.join(__dirname, 'assets/init.js'), 'utf8')
		let css_content = fs.readFileSync(path.join(__dirname, 'assets/styles.css'), 'utf8')
		js_content = js_content.replace('{MY_CUSTOM_STYLE}', '`' + css_content + '`')
		gmapp.webContents.executeJavaScript(js_content);
	})

	gmapp.webContents.on('did-finish-load', function () {
		data.content_loaded = true;
		tray.setImage(path.join(__dirname, 'assets/icons/icon.png'));
		gmapp.setIcon(path.join(__dirname, 'assets/icons/icon.png'));
	})
   
   if (settings.get('show_dev_tools')) {
      gmapp.openDevTools();
   }
}
