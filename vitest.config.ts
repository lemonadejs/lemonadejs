import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: [
            // Block sources import by PACKAGE NAME (what a consumer writes);
            // the monorepo maps the names onto the local sources
            { find: 'lemonadejs/test', replacement: path.resolve(__dirname, 'src/test.ts') },
            { find: 'lemonadejs/react', replacement: path.resolve(__dirname, 'src/react.ts') },
            { find: 'lemonadejs', replacement: path.resolve(__dirname, 'src/index.ts') },
            {
                find: /^@lemonadejs\/([\w-]+)$/,
                replacement: path.resolve(__dirname, 'components') + '/$1/src/index.ts',
            },
        ],
    },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.ts', 'components/**/*.test.ts'],
        poolOptions: {
            forks: {
                // global.gc for the destroy/memory stress tests
                execArgv: ['--expose-gc'],
            },
        },
    },
});
