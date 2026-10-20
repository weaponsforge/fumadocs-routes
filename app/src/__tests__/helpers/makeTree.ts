import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { vi } from 'vitest'
import type { MockInstance } from 'vitest'

export interface OutputSpies {
  warn: MockInstance<typeof console.warn>;
  error: MockInstance<typeof console.error>;
}

/**
 * Creates a temporary project root with a `package.json` and a `content/docs` folder
 * filled from a map of files.
 * @param {Record<string, string>} files - file contents by path relative to `content/docs`, eg. `'secrets/meta.json'`
 * @returns {string} absolute path of the temporary root
 */
export const makeTree = (files: Record<string, string> = {}): string => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'routes-'))
  const docs = path.join(root, 'content', 'docs')

  writeFileSync(path.join(root, 'package.json'), '{}')
  mkdirSync(docs, { recursive: true })

  for (const [file, content] of Object.entries(files)) {
    const target = path.join(docs, file)

    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
  }

  return root
}

/**
 * Builds the `private` frontmatter of a page
 * @param {boolean | string} [value] - the `private` value to write, omitted when `undefined`
 * @returns {string} page source
 */
export const createPage = (value?: boolean | string): string => {
  const line = value === undefined ? '' : `private: ${value}\n`

  return `---\ntitle: x\n${line}---\n\nBody\n`
}

/**
 * Builds the source of a `meta.json`
 * @param {Record<string, unknown>} [data] - fields to write
 * @returns {string} JSON source
 */
export const createMeta = (data: Record<string, unknown> = {}): string => {
  return JSON.stringify(data)
}

/**
 * Silences the console and stdout output of a run, and returns the spies
 * @returns {OutputSpies} spies for `console.warn` and `console.error`
 */
export const silenceOutput = (): OutputSpies => {
  vi.spyOn(process.stdout, 'write').mockReturnValue(true)

  return {
    warn: vi.spyOn(console, 'warn').mockReturnValue(),
    error: vi.spyOn(console, 'error').mockReturnValue(),
  }
}
