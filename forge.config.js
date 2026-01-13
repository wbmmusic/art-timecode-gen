const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { VitePlugin } = require('@electron-forge/plugin-vite');
const { PublisherGithub } = require('@electron-forge/publisher-github');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  hooks: {
    packageAfterCopy: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      console.log('📦 Installing production dependencies...');
      
      const pkgJsonSource = path.resolve(__dirname, 'package.json');
      const pkgJsonDest = path.join(buildPath, 'package.json');
      
      await fs.copy(pkgJsonSource, pkgJsonDest);
      
      console.log('Running: npm install --production');
      execSync('npm install --production --no-optional', {
        cwd: buildPath,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('✓ Production dependencies installed');
    }
  },
  packagerConfig: {
    name: 'ArtNet Timecode Generator',
    executableName: 'ArtNet Timecode Generator',
    icon: 'public/icon',
    asar: true,
    extraResource: [
      'public/artNetTc.js'
    ],
    win32metadata: {
      CompanyName: 'WBM Tek',
      FileDescription: 'ArtNet Timecode Generator - Professional Lighting Control',
      ProductName: 'ArtNet Timecode Generator',
      InternalName: 'ArtNet Timecode Generator',
      OriginalFilename: 'ArtNet Timecode Generator.exe'
    }
  },
  rebuildConfig: {
    force: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'art-timecode-gen',
      authors: 'Marece Williams',
      description: 'ArtNet Timecode Generator for Professional Lighting',
      iconUrl: 'https://raw.githubusercontent.com/wbmmusic/art-timecode-gen/master/public/icon.ico',
      setupIcon: 'public/icon.ico',
      windowsSign: {
        sha1: 'b281b2c2413406e54ac73f3f3b204121b4a66e64',
        hash: 'sha256',
        timestampServer: 'http://timestamp.digicert.com'
      }
    }),
    new MakerZIP({}, ['darwin']),
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
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/electron/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/electron/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};