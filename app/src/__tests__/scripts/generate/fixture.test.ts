import { mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, expect, test, vi } from 'vitest'

import { silenceOutput } from '@/__tests__/helpers/makeTree.js'
import { generate } from '@/scripts/generate/main.js'

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..')

// Same as the "Output" example in AGENTS.md and the README
const EXPECTED = {
  sections: ['characters', 'secrets', 'stats-calculator', 'weapons'],
  section_labels: {
    characters: 'MU Online characters',
    secrets: 'MU Online secrets',
    'stats-calculator': 'Character Stats Calculator',
    weapons: 'MU Online weapons',
  },
  private_sections: ['secrets', 'stats-calculator'],
  public_exceptions: ['secrets', 'secrets/skill-tips'],
  private_pages: ['characters/elf'],
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('generates the documented output for the sample content/docs fixture', () => {
  silenceOutput()

  const output = mkdtempSync(path.join(os.tmpdir(), 'routes-out-'))
  const result = generate({ args: { cwd: REPO_ROOT, output } })
  const docsRoutesFile = JSON.parse(readFileSync(path.join(output, 'docs-routes.json'), 'utf8'))

  expect(result).toEqual(EXPECTED)
  expect(docsRoutesFile).toEqual(EXPECTED)
})

test('writes the file with 2-space indent and a trailing newline', () => {
  silenceOutput()
  const output = mkdtempSync(path.join(os.tmpdir(), 'routes-out-'))

  generate({ args: { cwd: REPO_ROOT, output } })

  expect(readFileSync(path.join(output, 'docs-routes.json'), 'utf8'))
    .toBe(`${JSON.stringify(EXPECTED, null, 2)}\n`)
})

test('passes the sample fixture in strict mode', () => {
  silenceOutput()

  const output = mkdtempSync(path.join(os.tmpdir(), 'routes-out-'))
  const args = { cwd: REPO_ROOT, output, strict: true }

  expect(() => generate({ args })).not.toThrow()
})
