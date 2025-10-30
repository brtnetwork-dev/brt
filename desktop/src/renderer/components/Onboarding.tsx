/**
 * Onboarding flow components
 */

import React, { useState } from 'react';
import { AppConfig } from '../../main/config-manager';

interface OnboardingProps {
  initialConfig: AppConfig;
  onComplete: (config: AppConfig) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ initialConfig, onComplete }) => {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { title: 'Welcome', component: WelcomeStep },
    { title: 'Pool Configuration', component: PoolConfigStep },
    { title: 'Wallet Setup', component: WalletConfigStep },
    { title: 'Worker Settings', component: WorkerConfigStep },
    { title: 'CPU Configuration', component: CpuConfigStep },
  ];

  const CurrentStepComponent = steps[step].component;

  const handleNext = () => {
    const validation = validateStep(step, config);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Setup Progress</h2>
        {steps.map((s, idx) => (
          <div
            key={idx}
            style={{
              ...styles.sidebarStep,
              ...(idx === step ? styles.sidebarStepActive : {}),
              ...(idx < step ? styles.sidebarStepCompleted : {}),
            }}
          >
            <span style={styles.stepNumber}>{idx + 1}</span>
            <span style={styles.stepTitle}>{s.title}</span>
          </div>
        ))}
      </div>

      <div style={styles.content}>
        <div style={styles.stepContainer}>
          <CurrentStepComponent config={config} setConfig={setConfig} errors={errors} />
        </div>

        <div style={styles.navigation}>
          {step > 0 && (
            <button onClick={handleBack} style={styles.buttonSecondary}>
              Back
            </button>
          )}
          <button onClick={handleNext} style={styles.buttonPrimary}>
            {step < steps.length - 1 ? 'Next' : 'Start Mining'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Welcome Step
const WelcomeStep: React.FC<StepProps> = () => {
  return (
    <div style={styles.welcomeContainer}>
      <h1 style={styles.welcomeTitle}>Welcome to BRT</h1>
      <p style={styles.welcomeText}>
        This application allows you to contribute to cryptocurrency mining and track your
        contributions in real-time.
      </p>
      <div style={styles.featureList}>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>⚡</div>
          <div>
            <h3 style={styles.featureTitle}>Easy Setup</h3>
            <p style={styles.featureDesc}>Configure your mining settings in just a few steps</p>
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>📊</div>
          <div>
            <h3 style={styles.featureTitle}>Real-time Monitoring</h3>
            <p style={styles.featureDesc}>Track your hashrate and contributions live</p>
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>🏆</div>
          <div>
            <h3 style={styles.featureTitle}>Leaderboard</h3>
            <p style={styles.featureDesc}>Compete with other miners on the dashboard</p>
          </div>
        </div>
      </div>
      <p style={styles.disclaimer}>
        <strong>Note:</strong> This mining application is powered by XMRig (GPLv3 licensed). Make sure
        you have permission to use your computer's resources for mining.
      </p>
    </div>
  );
};

// Pool Configuration Step
const PoolConfigStep: React.FC<StepProps> = ({ config, setConfig, errors }) => {
  return (
    <div>
      <h2 style={styles.stepHeader}>Mining Pool Configuration</h2>
      <p style={styles.stepDescription}>
        Your contributions will be sent to the BRT Network pool.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.label}>Pool URL</label>
        <input
          type="text"
          value="brtnetwork.duckdns.org:3333"
          disabled
          style={{ ...styles.input, backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
        />
        <p style={styles.hint}>This pool is managed by BRT Network</p>
      </div>
    </div>
  );
};

// Wallet Configuration Step
const WalletConfigStep: React.FC<StepProps> = ({ config, setConfig, errors }) => {
  return (
    <div>
      <h2 style={styles.stepHeader}>Wallet Address</h2>
      <p style={styles.stepDescription}>
        Enter your Monero wallet address where you'll receive mining rewards.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.label}>Monero Wallet Address</label>
        <textarea
          value={config.walletAddress}
          onChange={(e) => setConfig({ ...config, walletAddress: e.target.value })}
          placeholder="4..."
          rows={3}
          style={{ ...styles.textarea, ...(errors.walletAddress ? styles.inputError : {}) }}
        />
        {errors.walletAddress && <span style={styles.error}>{errors.walletAddress}</span>}
        <p style={styles.hint}>A valid Monero address starts with "4" and is 95 characters long</p>
      </div>

      <div style={styles.warningBox}>
        <strong>⚠️ Important:</strong> Make sure this is your correct wallet address. Mining
        rewards will be sent here and cannot be recovered if incorrect.
      </div>
    </div>
  );
};

// Worker Configuration Step
const WorkerConfigStep: React.FC<StepProps> = ({ config, setConfig, errors }) => {
  return (
    <div>
      <h2 style={styles.stepHeader}>Email Address</h2>
      <p style={styles.stepDescription}>
        Enter your email address. This will identify your worker on the dashboard.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email Address</label>
        <input
          type="email"
          value={config.workerId}
          onChange={(e) => setConfig({ ...config, workerId: e.target.value })}
          placeholder="your.email@example.com"
          style={{ ...styles.input, ...(errors.workerId ? styles.inputError : {}) }}
        />
        {errors.workerId && <span style={styles.error}>{errors.workerId}</span>}
        <p style={styles.hint}>
          Your email will be used as your unique identifier on the leaderboard.
        </p>
      </div>

      <div style={styles.infoBox}>
        <strong>Why email?</strong>
        <ul style={styles.tipList}>
          <li>Identify your contribution uniquely</li>
          <li>Receive notifications (future feature)</li>
          <li>Claim your points on the leaderboard</li>
        </ul>
      </div>
    </div>
  );
};

// CPU Configuration Step
const CpuConfigStep: React.FC<StepProps> = ({ config, setConfig, errors }) => {
  const cpuCount = require('os').cpus().length;
  const percentage = Math.round((config.threads / cpuCount) * 100);

  return (
    <div>
      <h2 style={styles.stepHeader}>CPU Configuration</h2>
      <p style={styles.stepDescription}>
        Choose how many CPU threads to use for mining. More threads = higher hashrate but more CPU
        usage.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          CPU Threads: {config.threads} / {cpuCount} ({percentage}%)
        </label>
        <input
          type="range"
          min="1"
          max={cpuCount}
          value={config.threads}
          onChange={(e) => setConfig({ ...config, threads: parseInt(e.target.value) })}
          style={styles.slider}
        />
        {errors.threads && <span style={styles.error}>{errors.threads}</span>}
        <p style={styles.hint}>
          Default: {Math.floor(cpuCount * 0.75)} threads (75% of available cores)
        </p>
      </div>

      <div style={styles.cpuInfoBox}>
        <div style={styles.cpuMetric}>
          <span style={styles.cpuLabel}>Available CPUs:</span>
          <span style={styles.cpuValue}>{cpuCount}</span>
        </div>
        <div style={styles.cpuMetric}>
          <span style={styles.cpuLabel}>Selected Threads:</span>
          <span style={styles.cpuValue}>{config.threads}</span>
        </div>
        <div style={styles.cpuMetric}>
          <span style={styles.cpuLabel}>Usage:</span>
          <span style={styles.cpuValue}>{percentage}%</span>
        </div>
      </div>

      <div style={styles.infoBox}>
        <strong>💡 Recommendation:</strong> Use 75% of your CPU threads for optimal performance
        while keeping your system responsive.
      </div>
    </div>
  );
};

// Validation logic
function validateStep(step: number, config: AppConfig): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  switch (step) {
    case 0: // Welcome - no validation
      break;
    case 1: // Pool Config - auto-set, no validation needed
      // Ensure pool URL is set to BRT Network pool
      config.poolUrl = 'brtnetwork.duckdns.org:3333';
      break;
    case 2: // Wallet Config
      if (!config.walletAddress || config.walletAddress.trim() === '') {
        errors.walletAddress = 'Wallet address is required';
      } else if (!config.walletAddress.startsWith('4')) {
        errors.walletAddress = 'Invalid Monero address (must start with "4")';
      } else if (config.walletAddress.length < 95) {
        errors.walletAddress = 'Invalid Monero address (too short)';
      }
      break;
    case 3: // Email Config
      if (!config.workerId || config.workerId.trim() === '') {
        errors.workerId = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.workerId)) {
        errors.workerId = 'Please enter a valid email address';
      }
      break;
    case 4: // CPU Config
      if (config.threads < 1) {
        errors.threads = 'At least 1 thread is required';
      }
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Component types
interface StepProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  errors: Record<string, string>;
}

// Styles
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '30px 20px',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '30px',
  },
  sidebarStep: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    opacity: 0.6,
  },
  sidebarStepActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 1,
  },
  sidebarStepCompleted: {
    opacity: 1,
  },
  stepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    fontWeight: 'bold' as const,
  },
  stepTitle: {
    fontSize: '14px',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  stepContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
  },
  buttonPrimary: {
    padding: '12px 32px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '12px 32px',
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: '2px solid #1976d2',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
  welcomeContainer: {
    textAlign: 'center' as const,
  },
  welcomeTitle: {
    fontSize: '32px',
    marginBottom: '20px',
    color: '#1976d2',
  },
  welcomeText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    marginBottom: '40px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginBottom: '40px',
    textAlign: 'left' as const,
  },
  feature: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  featureIcon: {
    fontSize: '32px',
  },
  featureTitle: {
    fontSize: '18px',
    marginBottom: '5px',
    color: '#333',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#666',
  },
  disclaimer: {
    fontSize: '13px',
    color: '#666',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    textAlign: 'left' as const,
  },
  stepHeader: {
    fontSize: '28px',
    marginBottom: '10px',
    color: '#1976d2',
  },
  stepDescription: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  formGroup: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    marginBottom: '5px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    marginBottom: '5px',
    fontFamily: 'monospace',
    resize: 'vertical' as const,
  },
  inputError: {
    borderColor: '#f44336',
  },
  error: {
    display: 'block',
    color: '#f44336',
    fontSize: '13px',
    marginTop: '5px',
  },
  hint: {
    fontSize: '13px',
    color: '#999',
    marginTop: '5px',
  },
  infoBox: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '6px',
    fontSize: '14px',
  },
  warningBox: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '6px',
    fontSize: '14px',
  },
  poolList: {
    marginTop: '10px',
    marginLeft: '20px',
    lineHeight: '1.8',
  },
  tipList: {
    marginTop: '10px',
    marginLeft: '20px',
    lineHeight: '1.8',
  },
  slider: {
    width: '100%',
    height: '8px',
    marginBottom: '10px',
  },
  cpuInfoBox: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  cpuMetric: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '5px',
  },
  cpuLabel: {
    fontSize: '12px',
    color: '#666',
  },
  cpuValue: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#1976d2',
  },
};
