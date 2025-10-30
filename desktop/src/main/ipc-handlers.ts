/**
 * IPC (Inter-Process Communication) handlers
 * Handles communication between main and renderer processes
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { XMRigManager, XMRigConfig, XMRigStats } from './xmrig-manager';
import { ConfigManager, AppConfig } from './config-manager';
import { ContributionReporter } from './contribution-reporter';

export class IpcHandlers {
  private xmrigManager: XMRigManager;
  private configManager: ConfigManager;
  private contributionReporter: ContributionReporter;

  constructor(
    xmrigManager: XMRigManager,
    configManager: ConfigManager,
    contributionReporter: ContributionReporter
  ) {
    this.xmrigManager = xmrigManager;
    this.configManager = configManager;
    this.contributionReporter = contributionReporter;
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers(): void {
    // Configuration handlers
    ipcMain.handle('config:get', this.handleGetConfig.bind(this));
    ipcMain.handle('config:save', this.handleSaveConfig.bind(this));
    ipcMain.handle('config:reset', this.handleResetConfig.bind(this));

    // Mining control handlers
    ipcMain.handle('mining:start', this.handleStartMining.bind(this));
    ipcMain.handle('mining:stop', this.handleStopMining.bind(this));
    ipcMain.handle('mining:restart', this.handleRestartMining.bind(this));
    ipcMain.handle('mining:status', this.handleGetMiningStatus.bind(this));
    ipcMain.handle('mining:stats', this.handleGetMiningStats.bind(this));
  }

  /**
   * Get application configuration
   */
  private async handleGetConfig(_event: IpcMainInvokeEvent): Promise<AppConfig> {
    return this.configManager.get();
  }

  /**
   * Save application configuration
   */
  private async handleSaveConfig(
    _event: IpcMainInvokeEvent,
    config: AppConfig
  ): Promise<AppConfig> {
    return await this.configManager.save(config);
  }

  /**
   * Reset configuration to defaults
   */
  private async handleResetConfig(_event: IpcMainInvokeEvent): Promise<AppConfig> {
    return await this.configManager.reset();
  }

  /**
   * Start mining process
   */
  private async handleStartMining(_event: IpcMainInvokeEvent): Promise<void> {
    const config = this.configManager.get();

    if (!this.configManager.isValid(config)) {
      throw new Error('Invalid configuration. Please configure pool and wallet settings.');
    }

    const xmrigConfig: XMRigConfig = {
      poolUrl: config.poolUrl,
      walletAddress: config.walletAddress,
      workerId: config.workerId,
      threads: config.threads,
    };

    await this.xmrigManager.start(xmrigConfig);

    // Start contribution reporting
    this.contributionReporter.start(5000);
  }

  /**
   * Stop mining process
   */
  private async handleStopMining(_event: IpcMainInvokeEvent): Promise<void> {
    // Stop contribution reporting
    this.contributionReporter.stop();

    await this.xmrigManager.stop();
  }

  /**
   * Restart mining process
   */
  private async handleRestartMining(_event: IpcMainInvokeEvent): Promise<void> {
    await this.xmrigManager.restart();
  }

  /**
   * Get mining status
   */
  private async handleGetMiningStatus(_event: IpcMainInvokeEvent): Promise<boolean> {
    return this.xmrigManager.getIsRunning();
  }

  /**
   * Get mining statistics
   */
  private async handleGetMiningStats(_event: IpcMainInvokeEvent): Promise<XMRigStats | null> {
    return await this.xmrigManager.getStats();
  }
}
