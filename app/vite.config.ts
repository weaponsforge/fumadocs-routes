import { resolve } from 'path'
import { configDefaults, defineConfig } from 'vitest/config'

// Write the test report (without coverage) in a single HTML file
// when running in GitHub Actions CI
const isGithubActions = process.env.DOCKERHUB_USERNAME !== undefined

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    watch: {
      // tests write temp projects (with a package.json) here,
      // which would retrigger watch mode forever
      ignored: ['**/src/__tests__/artifacts/**'],
    },
  },
  test: {
    // reports and coverage artifacts go to .vitest/
    reporters: [
      ['verbose'],
      ['html', { singleFile: isGithubActions }],
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      reportsDirectory: '.vitest/coverage',
      include: ['src/lib', 'src/scripts', 'src/types', 'src/utils'],
      exclude: [
        'node_modules/',
        'dist/',
        'html/',
        '.vitest/',
        '**/*.html',
        '**/*.md',
        '**/*.ejs',
      ],
    },
    exclude: [
      ...configDefaults.exclude,
      'node_modules/**',
      'dist/**',
      '.cursor/**',
      '.git/**',
      '.github/**',
      '.vscode/**',
    ],
  },
})
