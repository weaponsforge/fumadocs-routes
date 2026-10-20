import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from 'vitest'

import {
  createMeta,
  createPage,
  makeTempDir,
  makeTree,
} from '@/__tests__/helpers/makeTree.js'

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..')
const CLI_FILE = path.join(REPO_ROOT, 'src', 'scripts', 'generate', 'cli.ts')

/**
 * Runs the CLI source in a child process through tsx, so it needs no build
 * @param {string[]} args - CLI arguments
 * @returns the exit code, stdout and stderr
 */
const runCli = (args: string[]) => {
  const { IS_DOCKER: _isDocker, ...env } = process.env
  const result = spawnSync(process.execPath, ['--import', 'tsx', CLI_FILE, ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf8',
  })

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

test('-d and -o read the docs folder and write docs-routes.json to the output folder', () => {
  const root = makeTree({
    'secrets/meta.json': createMeta({ root: true, private: true }),
    'secrets/index.mdx': createPage(),
  })

  const output = makeTempDir('routes-out-')
  const result = runCli(['-d', path.join(root, 'content', 'docs'), '-o', output])

  expect(result.status).toBe(0)
  expect(JSON.parse(readFileSync(path.join(output, 'docs-routes.json'), 'utf8'))).toMatchObject({
    sections: ['secrets'],
    private_sections: ['secrets'],
  })
}, 15000)

test('--strict exits with code 1 and prints the error to stderr', () => {
  const root = makeTree({ 'orphan/index.mdx': createPage() })
  const output = makeTempDir('routes-out-')

  const result = runCli(['--strict', '--docs', path.join(root, 'content', 'docs'), '--output', output])

  expect(result.status).toBe(1)
  expect(result.stderr).toContain('orphan has no meta.json')
  expect(result.stderr).toContain('[routes:generate] failed')
  expect(existsSync(path.join(output, 'docs-routes.json'))).toBe(false)
}, 15000)
