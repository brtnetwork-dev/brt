# BRT - Desktop Application

Electron-based desktop application for mining with integrated contribution tracking.

## Features

- **Easy Setup**: Guided onboarding flow for first-time users
- **Real-time Monitoring**: Live hashrate, shares, and uptime display
- **Automatic Reporting**: Sends mining statistics to web dashboard every 5 seconds
- **Cross-platform**: Windows and macOS support
- **Secure**: No sensitive data stored in plain text

## Requirements

- Node.js 18+
- XMRig binaries (see resources/xmrig/README.md)
- Valid Monero wallet address
- Mining pool credentials

## Installation

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:win   # Windows
npm run build:mac   # macOS
```

Built applications will be in `dist-electron/`.

## Configuration

### First Launch
On first launch, you'll be guided through:
1. **Pool Configuration**: Enter your mining pool URL (e.g., `pool.supportxmr.com:3333`)
2. **Wallet Setup**: Enter your Monero wallet address
3. **Worker ID**: Choose a unique identifier for this miner
4. **CPU Allocation**: Select how many CPU threads to use

### Configuration File
Settings are stored in:
- **Portable**: `config.json` (same directory as BRT.exe)
- **Windows (installed)**: `%APPDATA%/brt-desktop/config.json`
- **macOS (installed)**: `~/Library/Application Support/brt-desktop/config.json`

Example configuration:
```json
{
  "poolUrl": "pool.supportxmr.com:3333",
  "walletAddress": "4...",
  "workerId": "my-desktop-01",
  "threads": 6,
  "autoStart": false,
  "dashboardUrl": "https://your-dashboard.vercel.app"
}
```

## XMRig Integration

### Binary Location
XMRig binaries must be placed in:
```
resources/xmrig/
├── win-x64/xmrig.exe
├── darwin-x64/xmrig
└── darwin-arm64/xmrig
```

See `resources/xmrig/README.md` for download instructions.

### HTTP API
The application communicates with XMRig via its HTTP API on `127.0.0.1:18080`.

Statistics are polled every 5 seconds and displayed in the UI.

## Project Structure

```
desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts
│   │   ├── xmrig-manager.ts
│   │   ├── config-manager.ts
│   │   ├── ipc-handlers.ts
│   │   └── contribution-reporter.ts
│   ├── preload/        # Preload scripts (contextBridge)
│   │   └── index.ts
│   └── renderer/       # React UI
│       ├── app.tsx
│       ├── components/
│       └── hooks/
├── resources/          # Static resources
│   ├── xmrig/          # XMRig binaries
│   └── LICENSE-XMRIG.txt
├── dist/               # TypeScript build output
├── dist-electron/      # Final packaged apps
└── electron-builder.config.js
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the Electron app with:
- Hot reload enabled
- DevTools open
- Detailed logging

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Package application
npx electron-builder
```

## Troubleshooting

### XMRig Not Starting
- Verify binary exists in `resources/xmrig/[platform]/`
- Check binary has execute permissions (macOS/Linux)
- Review main process logs for errors

### Connection Issues
- Verify pool URL is correct and includes port
- Check firewall settings
- Ensure internet connectivity

### High CPU Usage
- Reduce thread count in settings
- Default is 75% of available cores
- Lower values reduce hashrate but improve responsiveness

## Security Considerations

- Wallet address is stored locally in config file
- No private keys or sensitive data transmitted
- All dashboard communication via HTTPS
- XMRig runs locally, not as a service

## Performance Tips

1. **CPU Allocation**: Start with 75% of cores, adjust based on system load
2. **Huge Pages**: Enable in OS for better performance (see XMRig docs)
3. **Pool Selection**: Choose a pool with low latency
4. **Background Mode**: Minimize app window to reduce UI overhead

## License

Application code: MIT License
XMRig: GPLv3 (see resources/LICENSE-XMRIG.txt)

## Support

- XMRig Documentation: https://xmrig.com/docs
- Monero Mining Guide: https://www.getmonero.org/resources/user-guides/mine-to-pool.html
