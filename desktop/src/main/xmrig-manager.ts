/**
 * XMRig process manager
 * Handles lifecycle of XMRig subprocess: start, stop, monitor
 */

import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface XMRigConfig {
  poolUrl: string;
  walletAddress: string;
  workerId: string;
  threads?: number;
  httpPort?: number;
  httpHost?: string;
}

export interface XMRigStats {
  hashrate: number;
  hashrate1m: number;
  hashrate10m: number;
  accepted: number;
  rejected: number;
  uptime: number;
  isRunning: boolean;
}

export class XMRigManager {
  private process: ChildProcess | null = null;
  private config: XMRigConfig | null = null;
  private isRunning = false;
  private xmrigPath: string;
  private configPath: string;

  constructor(resourcesPath: string) {
    this.xmrigPath = this.getXMRigBinaryPath(resourcesPath);
    this.configPath = path.join(resourcesPath, 'xmrig', 'config.json');
  }

  /**
   * Get platform-specific XMRig binary path
   */
  private getXMRigBinaryPath(resourcesPath: string): string {
    const platform = process.platform;
    const arch = process.arch;

    let binaryPath: string;

    if (platform === 'win32') {
      if (arch === 'arm64') {
        binaryPath = path.join(resourcesPath, 'xmrig', 'win-arm64', 'xmrig.exe');
      } else {
        binaryPath = path.join(resourcesPath, 'xmrig', 'win-x64', 'xmrig.exe');
      }
    } else if (platform === 'darwin') {
      if (arch === 'arm64') {
        binaryPath = path.join(resourcesPath, 'xmrig', 'darwin-arm64', 'xmrig');
      } else {
        binaryPath = path.join(resourcesPath, 'xmrig', 'darwin-x64', 'xmrig');
      }
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return binaryPath;
  }

  /**
   * Start XMRig process with given configuration
   */
  async start(config: XMRigConfig): Promise<void> {
    if (this.isRunning) {
      throw new Error('XMRig is already running');
    }

    // Validate binary exists
    if (!fs.existsSync(this.xmrigPath)) {
      throw new Error(`XMRig binary not found at: ${this.xmrigPath}`);
    }

    this.config = config;

    // Generate config file
    await this.writeConfigFile(config);

    // Spawn XMRig process
    this.process = spawn(this.xmrigPath, ['--config', this.configPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Handle process events
    this.process.stdout?.on('data', (data) => {
      console.log(`[XMRig] ${data.toString()}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`[XMRig Error] ${data.toString()}`);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`[XMRig] Process exited with code ${code}, signal ${signal}`);
      this.isRunning = false;
      this.process = null;
    });

    this.process.on('error', (error) => {
      console.error('[XMRig] Process error:', error);
      this.isRunning = false;
      this.process = null;
    });

    this.isRunning = true;
  }

  /**
   * Stop XMRig process
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.process) {
      return;
    }

    return new Promise((resolve) => {
      this.process!.once('exit', () => {
        this.isRunning = false;
        this.process = null;
        resolve();
      });

      // Send SIGTERM to gracefully stop
      this.process!.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  /**
   * Restart XMRig process
   */
  async restart(): Promise<void> {
    await this.stop();
    if (this.config) {
      await this.start(this.config);
    }
  }

  /**
   * Check if XMRig is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current mining statistics from XMRig HTTP API
   */
  async getStats(): Promise<XMRigStats | null> {
    if (!this.isRunning) {
      return null;
    }

    try {
      const httpHost = this.config?.httpHost || '127.0.0.1';
      const httpPort = this.config?.httpPort || 18080;
      const apiUrl = `http://${httpHost}:${httpPort}/2/summary`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse XMRig API response
      const stats: XMRigStats = {
        hashrate: data.hashrate?.total?.[0] || 0,
        hashrate1m: data.hashrate?.total?.[1] || 0,
        hashrate10m: data.hashrate?.total?.[2] || 0,
        accepted: data.results?.shares_good || 0,
        rejected: (data.results?.shares_total || 0) - (data.results?.shares_good || 0),
        uptime: Math.floor(data.uptime || 0),
        isRunning: this.isRunning,
      };

      return stats;
    } catch (error) {
      console.error('Failed to fetch XMRig stats:', error);
      // Return null on error, but keep process running
      return null;
    }
  }

  /**
   * Write XMRig configuration file
   */
  private async writeConfigFile(config: XMRigConfig): Promise<void> {
    const xmrigConfig = {
      'api': {
        'id': config.workerId,
        'worker-id': config.workerId,
      },
      'http': {
        'enabled': true,
        'host': config.httpHost || '127.0.0.1',
        'port': config.httpPort || 18080,
        'access-token': null,
        'restricted': true,
      },
      'autosave': true,
      'cpu': {
        'enabled': true,
        'huge-pages': true,
        'hw-aes': null,
        'priority': null,
        'max-threads-hint': config.threads || 75,
      },
      'opencl': false,
      'cuda': false,
      'pools': [
        {
          'algo': null,
          'coin': 'monero',
          'url': config.poolUrl,
          'user': config.walletAddress,
          'pass': config.workerId, // Email as password
          'rig-id': config.workerId, // Email as rig-id
          'keepalive': true,
          'enabled': true,
          'tls': false,
          'tls-fingerprint': null,
          'daemon': false,
          'socks5': null,
          'self-select': null,
          'submit-to-origin': false,
        },
      ],
      'retries': 5,
      'retry-pause': 5,
      'print-time': 60,
      'donate-level': 1,
    };

    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(xmrigConfig, null, 2));
  }
}
