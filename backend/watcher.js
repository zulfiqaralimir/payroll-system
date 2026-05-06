const chokidar = require('chokidar');
const path     = require('path');

let pendingFile  = null;
let watcherReady = false;

function startWatching(io) {
  const folder = process.env.WATCH_FOLDER;
  console.log(`Watching folder: ${folder}`);

  const watcher = chokidar.watch(folder, {
    persistent:       true,
    ignoreInitial:    false,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 }
  });

  watcher.on('add', (filePath) => {
    if (filePath.endsWith('.xlsx')) {
      pendingFile = filePath;
      console.log(`New Excel file detected: ${filePath}`);
      if (io) io.emit('excel_detected', {
        file:    path.basename(filePath),
        message: 'New Excel file detected. Import now?'
      });
    }
  });

  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.xlsx')) {
      pendingFile = filePath;
      console.log(`Excel file updated: ${filePath}`);
      if (io) io.emit('excel_detected', {
        file:    path.basename(filePath),
        message: 'Excel file updated. Import now?'
      });
    }
  });

  watcher.on('ready', () => {
    watcherReady = true;
    console.log('Folder watcher ready');
  });
}

function getPendingFile()  { return pendingFile; }
function clearPendingFile(){ pendingFile = null;  }

module.exports = { startWatching, getPendingFile, clearPendingFile };
