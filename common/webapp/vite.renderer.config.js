import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            'vue': fileURLToPath(new URL('./src/headless-vue-shim.js', import.meta.url))
        }
    },
    build: {
        outDir: 'dist-renderer',
        emptyOutDir: true,
        copyPublicDir: false,
        sourcemap: true,
        lib: {
            entry: fileURLToPath(new URL('./src/headless.js', import.meta.url)),
            formats: ['es'],
            fileName: () => 'bluemap-renderer.js'
        }
    }
})
