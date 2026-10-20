import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { makeTree, silenceOutput } from '@/__tests__/helpers/makeTree.js'
import { Diagnostics } from '@/lib/classes/diagnostics.js'
import { Reader } from '@/lib/classes/reader.js'

/**
 * Creates a reader over a temporary docs tree
 * @param {Record<string, string>} files - file contents by path relative to `content/docs`
 * @returns the reader, its diagnostics and the docs folder
 */
const setup = (files: Record<string, string> = {}) => {
  const rootDir = makeTree(files)
  const diagnostics = new Diagnostics()

  return {
    diagnostics,
    reader: new Reader(diagnostics, rootDir),
    docs: path.join(rootDir, 'content', 'docs'),
  }
}

/**
 * Flushes the diagnostics and returns what was printed as errors
 * @param {Diagnostics} diagnostics - diagnostics of a run
 * @param {ReturnType<typeof silenceOutput>} spies - spies from `silenceOutput()`
 * @returns {string[]} printed error messages
 */
const errorsOf = (diagnostics: Diagnostics, spies: ReturnType<typeof silenceOutput>) => {
  diagnostics.flush()

  return spies.error.mock.calls.map(([message]) => String(message))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readPrivate', () => {
  test.each([true, false])('returns an explicit %s', (value) => {
    const { reader, diagnostics } = setup()

    expect(reader.readPrivate({ private: value }, 'x.mdx')).toBe(value)
    expect(diagnostics.hasErrors()).toBe(false)
  })

  test('returns undefined when the value is absent or the data is null', () => {
    const { reader, diagnostics } = setup()

    expect(reader.readPrivate({}, 'x.mdx')).toBeUndefined()
    expect(reader.readPrivate(null, 'x.mdx')).toBeUndefined()
    expect(diagnostics.hasErrors()).toBe(false)
  })

  test.each(['true', 1, null, [], {}])('records an error for the non-boolean %j', (value) => {
    const spies = silenceOutput()
    const { reader, diagnostics, docs } = setup()

    expect(reader.readPrivate({ private: value }, path.join(docs, 'secrets', 'page.mdx'))).toBeUndefined()
    expect(diagnostics.hasErrors()).toBe(true)
    expect(errorsOf(diagnostics, spies)).toEqual([
      `[routes:generate] error: content/docs/secrets/page.mdx: "private" must be true or false, got ${JSON.stringify(value)}`,
    ])
  })
})

describe('readMeta', () => {
  test('returns null when the folder has no meta.json', () => {
    const { reader, docs, diagnostics } = setup()

    expect(reader.readMeta(docs)).toBeNull()
    expect(diagnostics.hasErrors()).toBe(false)
  })

  test('returns the parsed object', () => {
    const { reader, docs } = setup({ 'meta.json': '{"root":true,"private":true}' })

    expect(reader.readMeta(docs)).toEqual({ root: true, private: true })
  })

  test('returns {} and records an error for invalid JSON', () => {
    const spies = silenceOutput()
    const { reader, docs, diagnostics } = setup({ 'secrets/meta.json': '{ not json' })

    expect(reader.readMeta(path.join(docs, 'secrets'))).toEqual({})
    expect(diagnostics.hasErrors()).toBe(true)
    expect(errorsOf(diagnostics, spies)[0]).toContain('content/docs/secrets/meta.json: invalid JSON')
  })

  test.each(['null', '"text"', '42', 'true'])('returns {} without an error for the non-object JSON %s', (json) => {
    const { reader, docs, diagnostics } = setup({ 'meta.json': json })

    expect(reader.readMeta(docs)).toEqual({})
    expect(diagnostics.hasErrors()).toBe(false)
  })
})

describe('readFrontmatter', () => {
  test('returns the parsed frontmatter', () => {
    const { reader, docs } = setup({ 'a.mdx': '---\ntitle: A\nprivate: true\n---\n\nBody\n' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({ title: 'A', private: true })
  })

  test('returns {} when the page has no frontmatter', () => {
    const { reader, docs, diagnostics } = setup({ 'a.mdx': '# Just a heading\n' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({})
    expect(diagnostics.hasErrors()).toBe(false)
  })

  test('ignores a --- block that is not at the top of the file', () => {
    const { reader, docs } = setup({ 'a.mdx': 'text\n---\nprivate: true\n---\n' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({})
  })

  test('parses CRLF line endings', () => {
    const { reader, docs } = setup({ 'a.mdx': '---\r\ntitle: A\r\nprivate: true\r\n---\r\n\r\nBody\r\n' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({ title: 'A', private: true })
  })

  test('parses frontmatter at the very end of the file', () => {
    const { reader, docs } = setup({ 'a.mdx': '---\nprivate: true\n---' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({ private: true })
  })

  test('returns {} and records an error for invalid YAML', () => {
    const spies = silenceOutput()
    const { reader, docs, diagnostics } = setup({ 'secrets/a.mdx': '---\ntitle: [unclosed\n---\n' })

    expect(reader.readFrontmatter(path.join(docs, 'secrets', 'a.mdx'))).toEqual({})
    expect(errorsOf(diagnostics, spies)[0]).toContain('content/docs/secrets/a.mdx: invalid frontmatter')
  })

  test('returns {} for non-object YAML', () => {
    const { reader, docs, diagnostics } = setup({ 'a.mdx': '---\njust a string\n---\n' })

    expect(reader.readFrontmatter(path.join(docs, 'a.mdx'))).toEqual({})
    expect(diagnostics.hasErrors()).toBe(false)
  })

  test('reports paths relative to the root with forward slashes', () => {
    const spies = silenceOutput()
    const { reader, docs, diagnostics } = setup()
    const nested = path.join(docs, 'a', 'b')

    mkdirSync(nested, { recursive: true })
    writeFileSync(path.join(nested, 'meta.json'), '{')
    reader.readMeta(nested)

    expect(errorsOf(diagnostics, spies)[0]).toContain('content/docs/a/b/meta.json')
  })

  // The regex requires `---` at the first character, so a UTF-8 BOM drops the frontmatter
  // and its `private` flag without any error. Enable once the BOM is stripped.
  test.todo('strips a UTF-8 BOM before reading the frontmatter')
})
