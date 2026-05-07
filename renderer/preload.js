const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  previewDiff: (source, target) => ipcRenderer.invoke('run-robocopy', { source, target }),
  runCopy: (source, target) => ipcRenderer.invoke('run-robocopy-copy', { source, target }),
  onOutput: (callback) => ipcRenderer.on('robocopy-output', (_event, data) => callback(data)),
  removeOutputListener: () => ipcRenderer.removeAllListeners('robocopy-output'),
});
