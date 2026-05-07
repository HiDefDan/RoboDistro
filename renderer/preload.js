const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  chooseDirectory:        () => ipcRenderer.invoke('choose-directory'),
  previewDiff:            (source, target) => ipcRenderer.invoke('run-robocopy', { source, target }),
  runCopy:                (source, target) => ipcRenderer.invoke('run-robocopy-copy', { source, target }),
  startMonitor:           (source, target) => ipcRenderer.invoke('start-monitor', { source, target }),
  stopMonitor:            () => ipcRenderer.invoke('stop-monitor'),
  onOutput:               (cb) => ipcRenderer.on('robocopy-output', (_e, d) => cb(d)),
  onMonitorOutput:        (cb) => ipcRenderer.on('monitor-output', (_e, d) => cb(d)),
  onMonitorStopped:       (cb) => ipcRenderer.on('monitor-stopped', (_e, code) => cb(code)),
  removeOutputListener:   () => ipcRenderer.removeAllListeners('robocopy-output'),
  removeMonitorListeners: () => {
    ipcRenderer.removeAllListeners('monitor-output');
    ipcRenderer.removeAllListeners('monitor-stopped');
  },
});
