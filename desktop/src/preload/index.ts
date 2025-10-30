/**
 * Preload script for Electron
 * Exposes safe IPC methods to renderer process via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig } from '../main/config-manager';
import { XMRigStats } from '../main/xmrig-manager';

// Define the API that will be exposed to the renderer
const electronAPI = {
  // Configuration methods
  config: {
    get: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
    save: (config: AppConfig): Promise<AppConfig> => ipcRenderer.invoke('config:save', config),
    reset: (): Promise<AppConfig> => ipcRenderer.invoke('config:reset'),
  },

  // Mining control methods
  mining: {
    start: (): Promise<void> => ipcRenderer.invoke('mining:start'),
    stop: (): Promise<void> => ipcRenderer.invoke('mining:stop'),
    restart: (): Promise<void> => ipcRenderer.invoke('mining:restart'),
    getStatus: (): Promise<boolean> => ipcRenderer.invoke('mining:status'),
    getStats: (): Promise<XMRigStats | null> => ipcRenderer.invoke('mining:stats'),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// TypeScript type definitions for the exposed API
export type ElectronAPI = typeof electronAPI;

// Declare global type for TypeScript
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
