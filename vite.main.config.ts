import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
        browserField: false,
        mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    build: {
        rollupOptions: {
            external: [...builtinModules, 'electron'],
        },
    },
    plugins: [
        {
            name: 'copy-icon',
            writeBundle() {
                copyFileSync(
                    join(__dirname, 'public', 'icon.ico'),
                    join(__dirname, '.vite', 'build', 'icon.ico')
                );
            },
        },
    ],
});
