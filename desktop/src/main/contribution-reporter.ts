/**
 * Contribution Reporter
 * Periodically sends mining statistics to the dashboard API
 */

import { XMRigManager } from './xmrig-manager';
import { ConfigManager } from './config-manager';

export class ContributionReporter {
  private xmrigManager: XMRigManager;
  private configManager: ConfigManager;
  private intervalId: NodeJS.Timeout | null = null;
  private lastAccepted: number = 0;
  private isReporting: boolean = false;

  constructor(xmrigManager: XMRigManager, configManager: ConfigManager) {
    this.xmrigManager = xmrigManager;
    this.configManager = configManager;
  }

  /**
   * Start reporting contributions to dashboard
   */
  start(intervalMs: number = 5000): void {
    if (this.isReporting) {
      return;
    }

    this.isReporting = true;
    this.intervalId = setInterval(() => {
      this.reportContribution();
    }, intervalMs);

    console.log(`Contribution reporting started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop reporting contributions
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isReporting = false;
    this.lastAccepted = 0;
    console.log('Contribution reporting stopped');
  }

  /**
   * Report current contribution snapshot to dashboard
   */
  private async reportContribution(): Promise<void> {
    try {
      // Only report if mining is running
      if (!this.xmrigManager.getIsRunning()) {
        return;
      }

      // Get current stats
      const stats = await this.xmrigManager.getStats();
      if (!stats) {
        return;
      }

      // Get configuration
      const config = this.configManager.get();
      const dashboardUrl = config.dashboardUrl;

      if (!dashboardUrl) {
        console.warn('Dashboard URL not configured');
        return;
      }

      // Prepare contribution data
      const contributionData = {
        worker: config.workerId,
        hashrate1m: stats.hashrate1m,
        hashrate10m: stats.hashrate10m,
        accepted: stats.accepted,
        rejected: stats.rejected,
        totalHashes: stats.accepted * 1000, // Rough estimate
      };

      // Send to dashboard API
      const response = await fetch(`${dashboardUrl}/api/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contributionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to report contribution:', response.status, errorData);
        return;
      }

      const result = await response.json();

      // Log points awarded if any
      if (result.pointsAwarded) {
        console.log(
          `Contribution reported: ${config.workerId} earned ${result.pointsAwarded} points`
        );
      }

      // Update last accepted count
      this.lastAccepted = stats.accepted;
    } catch (error) {
      console.error('Error reporting contribution:', error);
    }
  }

  /**
   * Check if reporter is running
   */
  isRunning(): boolean {
    return this.isReporting;
  }
}
