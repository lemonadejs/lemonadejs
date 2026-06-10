import { defineConfig } from 'vitest/config';

export default defineConfig({
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
