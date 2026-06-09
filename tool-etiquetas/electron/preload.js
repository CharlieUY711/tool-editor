const { contextBridge } = require('electron')

// Exponer APIs seguras al renderer si se necesitan en el futuro
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
})
