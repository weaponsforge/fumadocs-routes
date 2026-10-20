import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { createMeta, makeTree, silenceOutput } from '@/__tests__/helpers/makeTree.js'
import { Diagnostics } from '@/lib/classes/diagnostics.js'
import { Reader } from '@/lib/classes/reader.js'
import { RoutesCollection } from '@/lib/classes/routes.js'
import { collectSections } from '@/lib/section.js'

/**
 * Collects the sections of a temporary docs tree
 * @param {Record<string, string>} files - file contents by path relative to `content/docs`
 * @param {boolean} [strict] - treat a missing meta.json as an error
 * @returns the routes, the printed warnings and errors
 */
const runSections = (files: Record<string, string>, strict = false) => {
  const spies = silenceOutput()
  const rootDir = makeTree(files)
  const diagnostics = new Diagnostics()
  const routes = new RoutesCollection()

  collectSections({
    diagnostics,
    reader: new Reader(diagnostics, rootDir),
    routes,
    contentDir: path.join(rootDir, 'content', 'docs'),
    rootDir,
    strict,
  })

  diagnostics.flush()

  return {
    ...routes.toJSON(),
    hasErrors: diagnostics.hasErrors(),
    warnings: spies.warn.mock.calls.map(([message]) => String(message)),
    errors: spies.error.mock.calls.map(([message]) => String(message)),
  }
}

const indexPage = (description: string) => `---\ntitle: x\ndescription: ${description}\n---\n`

afterEach(() => {
  vi.restoreAllMocks()
})

describe('which folders are sections', () => {
  test('only folders with root: true', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true }),
      'b/meta.json': createMeta({ root: false }),
      'c/meta.json': createMeta({ title: 'C' }),
      'd/meta.json': createMeta({ root: 'true' }),
    })

    expect(result.sections).toEqual(['a'])
    expect(result.warnings).toEqual([])
    expect(result.errors).toEqual([])
  })

  test('nested root: true folders are not sections', () => {
    const result = runSections({
      'characters/meta.json': createMeta({ root: true }),
      'characters/classes/meta.json': createMeta({ root: true }),
    })

    expect(result.sections).toEqual(['characters'])
  })

  test('folders inside top-level groups are sections, groups add no segment', () => {
    const result = runSections({
      '(extra)/items/meta.json': createMeta({ root: true }),
      '(extra)/(deeper)/tools/meta.json': createMeta({ root: true }),
      '(extra)/nested/page/meta.json': createMeta({ root: true }),
    })

    expect(result.sections).toEqual(['items', 'tools'])
    expect(result.warnings.some((message) => message.includes('(extra)/nested has no meta.json'))).toBe(true)
  })

  test('a group folder itself needs no meta.json', () => {
    const result = runSections({ '(extra)/items/meta.json': createMeta({ root: true }) })

    expect(result.warnings).toEqual([])
    expect(result.errors).toEqual([])
  })

  test('files at the docs root are ignored', () => {
    const result = runSections({
      'index.mdx': '---\ntitle: x\n---\n',
      'meta.json': createMeta({ pages: [] }),
    })

    expect(result.sections).toEqual([])
    expect(result.warnings).toEqual([])
  })
})

describe('missing meta.json', () => {
  const files = { 'orphan/index.mdx': '---\ntitle: x\n---\n' }

  test('is a warning by default and the folder is left out', () => {
    const result = runSections(files)

    expect(result.sections).toEqual([])
    expect(result.hasErrors).toBe(false)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('content/docs/orphan has no meta.json')
  })

  test('is an error with strict', () => {
    const result = runSections(files, true)

    expect(result.sections).toEqual([])
    expect(result.hasErrors).toBe(true)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('content/docs/orphan has no meta.json')
    expect(result.warnings).toEqual([])
  })

  test('only affects the folder without it', () => {
    const result = runSections({ ...files, 'ok/meta.json': createMeta({ root: true }) })

    expect(result.sections).toEqual(['ok'])
    expect(result.warnings).toHaveLength(1)
  })
})

describe('section labels', () => {
  test('prefers the meta.json description', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true, description: 'From meta' }),
      'a/index.mdx': indexPage('From index'),
    })

    expect(result.section_labels).toEqual({ a: 'From meta' })
  })

  test('falls back to the index.mdx description', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true }),
      'a/index.mdx': indexPage('From index'),
    })

    expect(result.section_labels).toEqual({ a: 'From index' })
  })

  test('falls back to the index.md description', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true }),
      'a/index.md': indexPage('From md'),
    })

    expect(result.section_labels).toEqual({ a: 'From md' })
  })

  test('prefers index.mdx over index.md', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true }),
      'a/index.mdx': indexPage('From mdx'),
      'a/index.md': indexPage('From md'),
    })

    expect(result.section_labels).toEqual({ a: 'From mdx' })
  })

  test('falls back to the folder name', () => {
    const result = runSections({ 'my-section/meta.json': createMeta({ root: true }) })

    expect(result.section_labels).toEqual({ 'my-section': 'my-section' })
  })

  test('skips empty, whitespace-only and non-string descriptions', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true, description: '   ' }),
      'a/index.mdx': indexPage('From index'),
      'b/meta.json': createMeta({ root: true, description: 42 }),
      'c/meta.json': createMeta({ root: true, description: '' }),
      'c/index.mdx': '---\ntitle: x\ndescription: "  "\n---\n',
    })

    expect(result.section_labels).toEqual({
      a: 'From index',
      b: 'b',
      c: 'c',
    })
  })

  test('trims the label', () => {
    const result = runSections({ 'a/meta.json': createMeta({ root: true, description: '  Padded  ' }) })

    expect(result.section_labels).toEqual({ a: 'Padded' })
  })

  test('a section with an index page without frontmatter falls back to the folder name', () => {
    const result = runSections({
      'a/meta.json': createMeta({ root: true }),
      'a/index.mdx': '# Heading only\n',
    })

    expect(result.section_labels).toEqual({ a: 'a' })
  })
})
