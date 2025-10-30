/**
 * Electron main process entry point
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { XMRigManager } from './xmrig-manager';
import { ConfigManager } from './config-manager';
import { IpcHandlers } from './ipc-handlers';
import { ContributionReporter } from './contribution-reporter';

let mainWindow: BrowserWindow | null = null;
let xmrigManager: XMRigManager | null = null;
let configManager: ConfigManager | null = null;
let contributionReporter: ContributionReporter | null = null;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'BRT',
  });

  // Load the renderer HTML
  if (process.env.NODE_ENV === 'development') {
    // In development, load from dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize application
 */
async function initialize() {
  // Get resources path
  const resourcesPath = process.resourcesPath || path.join(__dirname, '../../resources');

  // Initialize managers
  xmrigManager = new XMRigManager(resourcesPath);
  configManager = new ConfigManager();
  contributionReporter = new ContributionReporter(xmrigManager, configManager);

  // Load configuration
  await configManager.load();

  // Register IPC handlers
  const ipcHandlers = new IpcHandlers(xmrigManager, configManager, contributionReporter);
  ipcHandlers.registerHandlers();

  // Auto-start mining if configured
  const config = configManager.get();
  if (config.autoStart && configManager.isValid(config)) {
    try {
      await xmrigManager.start({
        poolUrl: config.poolUrl,
        walletAddress: config.walletAddress,
        workerId: config.workerId,
        threads: config.threads,
      });
      console.log('Mining auto-started');

      // Start contribution reporting
      if (contributionReporter) {
        contributionReporter.start(5000); // Report every 5 seconds
      }
    } catch (error) {
      console.error('Failed to auto-start mining:', error);
    }
  }
}

/**
 * App lifecycle events
 */

app.whenReady().then(async () => {
  await initialize();
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Stop contribution reporting
  if (contributionReporter) {
    contributionReporter.stop();
  }

  // Stop mining before quitting
  if (xmrigManager) {
    await xmrigManager.stop();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
