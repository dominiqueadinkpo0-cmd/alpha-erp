const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  platform: process.platform
});
