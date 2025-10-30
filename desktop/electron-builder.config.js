module.exports = {
  appId: 'com.brt.app',
  productName: 'BRT',
  directories: {
    output: 'dist-electron',
    buildResources: 'resources',
  },
  files: [
    'dist/**/*',
    'resources/**/*',
    'package.json',
    '!src/**/*',
    '!**/*.ts',
    '!**/*.tsx'
  ],
  extraResources: [
    {
      from: 'resources/xmrig',
      to: 'xmrig',
      filter: ['**/*'],
    },
    {
      from: 'resources/LICENSE-XMRIG.txt',
      to: 'LICENSE-XMRIG.txt',
    },
  ],
  win: {
    target: [
      {
        target: 'portable',
        arch: ['arm64']
      }
    ],
    icon: 'resources/icon.ico',
  },
  portable: {
    artifactName: 'BRT-${version}-portable.${ext}',
  },
  compression: 'maximum',
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'resources/icon.icns',
    category: 'public.app-category.utilities',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
  },
  linux: {
    target: ['AppImage'],
    category: 'Utility',
  },
};
