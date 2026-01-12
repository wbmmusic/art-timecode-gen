import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
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
            appleId: process.env.APPLEID!,
            appleIdPassword: process.env.artTCgenIDPASS!,
            teamId: process.env.APPLE_TEAM_ID!
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

export default config;
