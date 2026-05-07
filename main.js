const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

// Hot-reload in development: renderer changes reload the window,
// main process changes restart the app automatically.
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
    watchRenderer: true,
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('choose-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return '';
  return result.filePaths[0];
});

// Shared helper — spawns robocopy and streams output back to the renderer.
// Args are passed as an array so paths with spaces are handled correctly
// without any shell quoting.
function spawnRobocopy(flags, source, target) {
  return new Promise((resolve) => {
    const args = [source, target, ...flags.split(' ').filter(Boolean)];
    const proc = spawn('robocopy', args);
    let output = '';
    proc.stdout.on('data', (data) => {
      mainWindow.webContents.send('robocopy-output', data.toString());
      output += data.toString();
    });
    proc.stderr.on('data', (data) => {
      mainWindow.webContents.send('robocopy-output', data.toString());
      output += data.toString();
    });
    proc.on('close', (code) => resolve({ code, output }));
  });
}

// Dry-run diff — /L means no files are actually copied
ipcMain.handle('run-robocopy', async (event, { source, target }) => {
  return spawnRobocopy('/MIR /L /R:1 /W:1 /NJH /NJS', source, target);
});

// Live copy — full MIR with retry suppressed for speed
ipcMain.handle('run-robocopy-copy', async (event, { source, target }) => {
  return spawnRobocopy('/MIR /Z /MT:16 /R:3 /W:1 /NJH /NJS', source, target);
});
