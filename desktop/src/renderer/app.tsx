/**
 * Main React application component for desktop renderer
 */

import React, { useState, useEffect } from 'react';
import { AppConfig } from '../main/config-manager';
import { XMRigStats } from '../main/xmrig-manager';
import { Onboarding } from './components/Onboarding';

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isMining, setIsMining] = useState(false);
  const [stats, setStats] = useState<XMRigStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load initial configuration
  useEffect(() => {
    loadConfig();
  }, []);

  // Poll mining status and stats
  useEffect(() => {
    const interval = setInterval(async () => {
      if (window.electron) {
        const status = await window.electron.mining.getStatus();
        setIsMining(status);

        if (status) {
          const miningStats = await window.electron.mining.getStats();
          setStats(miningStats);
        } else {
          setStats(null);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      if (window.electron) {
        const cfg = await window.electron.config.get();
        setConfig(cfg);

        // Show onboarding if config is invalid (missing required fields)
        const isValid = cfg.walletAddress && cfg.walletAddress.trim() !== '';
        setShowOnboarding(!isValid);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (newConfig: AppConfig) => {
    try {
      if (window.electron) {
        // Save configuration
        await window.electron.config.save(newConfig);
        setConfig(newConfig);
        setShowOnboarding(false);

        // Automatically start mining after onboarding
        await window.electron.mining.start();
        setIsMining(true);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert(`Failed to start mining: ${error}`);
    }
  };

  const handleStartMining = async () => {
    try {
      if (window.electron) {
        await window.electron.mining.start();
        setIsMining(true);
      }
    } catch (error) {
      console.error('Failed to start mining:', error);
      alert(`Failed to start mining: ${error}`);
    }
  };

  const handleStopMining = async () => {
    try {
      if (window.electron) {
        await window.electron.mining.stop();
        setIsMining(false);
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to stop mining:', error);
      alert(`Failed to stop mining: ${error}`);
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    try {
      if (window.electron) {
        await window.electron.config.save(newConfig);
        setConfig(newConfig);
        alert('Configuration saved successfully');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(`Failed to save configuration: ${error}`);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  // Show onboarding if configuration is invalid
  if (showOnboarding && config) {
    return <Onboarding initialConfig={config} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>BRT</h1>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>Mining Status</h2>
          <div style={styles.statusContainer}>
            <div style={styles.statusBadge(isMining)}>
              {isMining ? 'Running' : 'Stopped'}
            </div>
            <div style={styles.controls}>
              {!isMining ? (
                <button onClick={handleStartMining} style={styles.button}>
                  Start Mining
                </button>
              ) : (
                <button onClick={handleStopMining} style={styles.buttonDanger}>
                  Stop Mining
                </button>
              )}
            </div>
          </div>

          {stats && isMining && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Hashrate (Current)</div>
                <div style={styles.statValue}>{stats.hashrate.toFixed(2)} H/s</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Hashrate (1m)</div>
                <div style={styles.statValue}>{stats.hashrate1m.toFixed(2)} H/s</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Hashrate (10m)</div>
                <div style={styles.statValue}>{stats.hashrate10m.toFixed(2)} H/s</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Accepted Shares</div>
                <div style={styles.statValue}>{stats.accepted}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Rejected Shares</div>
                <div style={styles.statValue}>{stats.rejected}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Uptime</div>
                <div style={styles.statValue}>
                  {Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s
                </div>
              </div>
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2>Configuration</h2>
          {config && (
            <div style={styles.configForm}>
              <div style={styles.formGroup}>
                <label>Pool URL</label>
                <input
                  type="text"
                  value={config.poolUrl}
                  onChange={(e) => setConfig({ ...config, poolUrl: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Wallet Address</label>
                <input
                  type="text"
                  value={config.walletAddress}
                  onChange={(e) => setConfig({ ...config, walletAddress: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={config.workerId}
                  onChange={(e) => setConfig({ ...config, workerId: e.target.value })}
                  placeholder="your.email@example.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>CPU Threads (%)</label>
                <input
                  type="number"
                  value={config.threads}
                  onChange={(e) => setConfig({ ...config, threads: parseInt(e.target.value) })}
                  style={styles.input}
                  min="1"
                />
              </div>
              <button onClick={() => handleSaveConfig(config)} style={styles.button}>
                Save Configuration
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// Basic inline styles for the skeleton
const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
  },
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
  },
  section: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '15px',
  },
  statusBadge: (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: isActive ? '#4caf50' : '#f44336',
    color: 'white',
    fontWeight: 'bold' as const,
  }),
  controls: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  buttonDanger: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  configForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    marginTop: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
};
