const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerDMG } = require('@electron-forge/maker-dmg');
const { PublisherGithub } = require('@electron-forge/publisher-github');
const { VitePlugin } = require('@electron-forge/plugin-vite');

module.exports = {
  packagerConfig: {
    name: 'ArtTimecode Gen',
    executableName: 'art-timecode-gen',
    appBundleId: 'com.wbm.arttimecodegen',
    appCopyright: 'WBM Tek',
    icon: './public/icon',
    extraResource: [
      './public/artNetTc.js'
    ],
    asar: true,
    osxSign: {
      identity: 'Developer ID Application: WBM Tek'
    },
    osxNotarize: {
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.artTCgenIDPASS,
      teamId: process.env.APPLE_TEAM_ID
    },
    win32metadata: {
      CompanyName: 'WBM Tek',
      FileDescription: 'ArtNet Timecode Generator',
      ProductName: 'ArtTimecode Gen',
      InternalName: 'ArtTimecode Gen',
      OriginalFilename: 'art-timecode-gen.exe'
    }
  },
  rebuildConfig: {
    force: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'art-timecode-gen',
      setupExe: 'ArtTimecode-Gen-Setup.exe',
      setupIcon: './public/icon.ico',
      signWithParams: '/sha1 b281b2c2413406e54ac73f3f3b204121b4a66e64 /fd sha256 /tr http://timestamp.sectigo.com /td sha256'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      format: 'ULFO'
    }),
    new MakerDeb({
      options: {
        name: 'art-timecode-gen',
        productName: 'ArtTimecode Gen',
        genericName: 'ArtNet Timecode Generator',
        description: 'ArtNet Timecode Generator',
        categories: ['AudioVideo'],
        maintainer: 'WBM Tek',
        homepage: 'https://www.wbmtek.com'
      }
    }),
    new MakerRpm({
      options: {
        name: 'art-timecode-gen',
        productName: 'ArtTimecode Gen',
        genericName: 'ArtNet Timecode Generator',
        description: 'ArtNet Timecode Generator',
        categories: ['AudioVideo']
      }
    })
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/electron/main.js',
          config: 'vite.main.config.js',
        },
        {
          entry: 'src/electron/preload.js',
          config: 'vite.preload.config.js',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.js',
        },
      ],
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'wbmmusic',
        name: 'art-timecode-gen'
      },
      prerelease: false,
      draft: true
    })
  ]
};