/**
 * Configuration manager for desktop application
 * Handles storage and retrieval of user settings
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface AppConfig {
  poolUrl: string;
  walletAddress: string;
  workerId: string;
  threads: number;
  autoStart: boolean;
  dashboardUrl: string;
}

export class ConfigManager {
  private configPath: string;
  private config: AppConfig | null = null;

  constructor() {
    // For portable: store config.json next to .exe
    // Get directory where .exe is located
    const exePath = path.dirname(process.execPath);
    this.configPath = path.join(exePath, 'config.json');
  }

  /**
   * Load configuration from disk
   */
  async load(): Promise<AppConfig> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
        return this.config!;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Return default config if file doesn't exist or error occurred
    this.config = this.getDefaultConfig();
    return this.config;
  }

  /**
   * Save configuration to disk
   */
  async save(config: AppConfig): Promise<AppConfig> {
    try {
      this.config = config;
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return this.config;
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  get(): AppConfig {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }
    return this.config;
  }

  /**
   * Update specific configuration fields
   */
  async update(updates: Partial<AppConfig>): Promise<AppConfig> {
    const currentConfig = this.get();
    const updatedConfig = { ...currentConfig, ...updates };
    await this.save(updatedConfig);
    return updatedConfig;
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<AppConfig> {
    const defaultConfig = this.getDefaultConfig();
    await this.save(defaultConfig);
    return defaultConfig;
  }

  /**
   * Check if configuration is valid
   */
  isValid(config?: AppConfig): boolean {
    const cfg = config || this.config;
    if (!cfg) {
      return false;
    }

    return Boolean(
      cfg.poolUrl &&
        cfg.walletAddress &&
        cfg.workerId &&
        cfg.threads > 0 &&
        cfg.dashboardUrl
    );
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AppConfig {
    return {
      poolUrl: 'brtnetwork.duckdns.org:3333',
      walletAddress: '',
      workerId: '', // Will be email address
      threads: Math.max(1, Math.floor((require('os').cpus().length * 75) / 100)),
      autoStart: false,
      dashboardUrl: 'https://brt-dashboard.vercel.app',
    };
  }

  /**
   * Export configuration for sharing
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  async import(configJson: string): Promise<AppConfig> {
    try {
      const importedConfig = JSON.parse(configJson);
      if (this.isValid(importedConfig)) {
        await this.save(importedConfig);
        return importedConfig;
      } else {
        throw new Error('Invalid configuration format');
      }
    } catch (error) {
      console.error('Error importing config:', error);
      throw error;
    }
  }
}
