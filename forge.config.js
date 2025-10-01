module.exports = {
  packagerConfig: {
    asar: true,
    icon: './public/icon',
    executableName: 'art-timecode-gen',
    appBundleId: 'com.wbm.arttimecodegen',
    appCopyright: 'WBM Tek',
    appVersion: require('./package.json').version,
    buildVersion: require('./package.json').version,
    extraResource: [
      './public/artNetTc.js'
    ],
    osxSign: {
      identity: 'WBM Tek (Mareci, William)',
      'hardened-runtime': true,
      'gatekeeper-assess': false,
      entitlements: './entitlements.mac.plist',
      'entitlements-inherit': './entitlements.mac.plist'
    },
    osxNotarize: {
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.artTCgenIDPASS,
      teamId: process.env.APPLE_TEAM_ID
    },
    win32metadata: {
      CompanyName: 'WBM Tek',
      ProductName: 'ArtTimecode Gen'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'art-timecode-gen',
        certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
        certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/electron/main.js',
            config: 'vite.main.config.js'
          },
          {
            entry: 'src/electron/preload.js',
            config: 'vite.preload.config.js'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.js'
          }
        ]
      }
    }
  ]
};