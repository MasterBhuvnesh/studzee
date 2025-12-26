/**
 * VITEST CONFIGURATION
 *
 * This file configures how Vitest runs our tests.
 *
 * What does this do?
 * - Sets up test environment (Node.js)
 * - Configures path aliases (@/ = src/)
 * - Sets up coverage reporting
 * - Runs global setup before all tests
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // globals: true - Makes describe, it, expect available without importing
    globals: true,

    // environment: 'node' - Tests run in Node.js (not browser)
    environment: 'node',

    // setupFiles - Runs this file before ALL tests
    // Good for: setting env vars, global mocks, etc.
    setupFiles: ['./src/tests/setup/globalSetup.ts'],

    // coverage - Configuration for code coverage reports
    coverage: {
      provider: 'istanbul', // Coverage engine (istanbul provides better HTML reports with branch visualization)
      reporter: ['text', 'json', 'html', 'lcov'], // Output formats (lcov added for CI/CD integration)
      exclude: [
        'node_modules/', // Don't measure coverage of dependencies
        'dist/', // Don't measure built files
        'src/tests/', // Don't measure test files themselves
        '**/*.test.ts', // Exclude all test files
        '**/*.mock.test.ts', // Exclude mocked test files
        // Bootstrap
        '**/src/index.ts',

        // Config & infra
        '**/src/config/**',

        // CLI & jobs
        '**/src/cli/**',
        '**/src/jobs/**',

        // Controllers not under test
        '**/src/api/controllers/admin.controller.ts',
        '**/src/api/controllers/upload.controller.ts',

        // Routes with no business logic
        '**/src/api/routes/admin.route.ts',
        '**/src/api/routes/auth.route.ts',

        // Middleware (infra-heavy)
        '**/src/middleware/upload.ts',
        '**/src/middleware/helmet.ts',

        // Validation-only
        '**/src/models/document.validation.ts',

        // Services not implemented/tested yet
        '**/src/services/admin.service.ts',
        '**/src/services/pdf.service.ts',

        // Utilities tested indirectly
        '**/src/utils/cache.ts',

        // Logger
        '**/src/utils/logger.ts',

        // Tests
        '**/src/tests/**',
      ],
    },
  },

  // resolve.alias - Makes @/ work in imports
  // Example: import { config } from '@/config' instead of '../../../config'
  // Note: Vite/Vitest automatically handles @/* when @ is mapped to src
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
