import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createMeta,
  createPage,
  makeTempDir,
  makeTree,
  silenceOutput,
} from '@/__tests__/helpers/makeTree.js'
import { generate } from '@/scripts/generate/main.js'

// A top-level folder without `meta.json`: a warning, or an error with `strict`
const ORPHAN_FOLDER = { 'orphan/index.mdx': createPage() }

afterEach(() => {
  vi.restoreAllMocks()
})

test('uses args.cwd and writes docs-routes.json in that root', () => {
  vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  vi.spyOn(console, 'warn').mockReturnValue()
  const root = makeTree(ORPHAN_FOLDER)

  generate({ args: { cwd: root } })

  const docsRouteFile = JSON.parse(
    readFileSync(path.join(root, 'docs-routes.json'), 'utf8'),
  )

  expect(docsRouteFile).toMatchObject({ sections: [] })
})

test('ignores --strict in the host process.argv', () => {
  vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  vi.spyOn(console, 'warn').mockReturnValue()

  // Set --strict in process.argv
  const argv = [...process.argv, '--strict']
  vi.spyOn(process, 'argv', 'get').mockReturnValue(argv)

  // But only reads the explicitly-defined args object
  expect(() => generate({ args: { cwd: makeTree(ORPHAN_FOLDER) } })).not.toThrow()
})

test('args.strict turns the missing meta.json warning into an error', () => {
  vi.spyOn(console, 'error').mockReturnValue()

  expect(() => generate({ args: { cwd: makeTree(ORPHAN_FOLDER), strict: true } })).toThrow('failed')
})

describe('validation errors', () => {
  const outputFile = (root: string) => path.join(root, 'docs-routes.json')

  test.each([false, true])('a non-boolean private throws and writes nothing (strict: %s)', (strict) => {
    silenceOutput()
    const root = makeTree({
      'a/meta.json': createMeta({ root: true }),
      'a/page.mdx': createPage('"yes"'),
    })

    expect(() => generate({ args: { cwd: root, strict } })).toThrow('failed')
    expect(existsSync(outputFile(root))).toBe(false)
  })

  test('an invalid meta.json throws and writes nothing', () => {
    silenceOutput()
    const root = makeTree({ 'a/meta.json': '{ nope' })

    expect(() => generate({ args: { cwd: root } })).toThrow('failed')
    expect(existsSync(outputFile(root))).toBe(false)
  })

  test('invalid frontmatter throws and writes nothing', () => {
    silenceOutput()

    const root = makeTree({
      'a/meta.json': createMeta({ root: true }),
      'a/page.mdx': '---\ntitle: [unclosed\n---\n',
    })

    expect(() => generate({ args: { cwd: root } })).toThrow('failed')
    expect(existsSync(outputFile(root))).toBe(false)
  })

  test('prints the errors to stderr before throwing', () => {
    const { error } = silenceOutput()
    const root = makeTree({ 'a/meta.json': '{ nope' })

    expect(() => generate({ args: { cwd: root } })).toThrow()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('content/docs/a/meta.json: invalid JSON'))
  })
})

describe('--output', () => {
  test('an existing file path throws', () => {
    silenceOutput()
    const root = makeTree()
    const file = path.join(root, 'existing.txt')

    writeFileSync(file, 'x')

    expect(() => generate({ args: { cwd: root, output: file } })).toThrow('--output expects a folder')
  })

  test('a path ending in .json throws, even if it does not exist', () => {
    silenceOutput()
    const root = makeTree()

    expect(() => generate({ args: { cwd: root, output: path.join(root, 'out.JSON') } })).toThrow('--output expects a folder')
  })

  test('creates a missing nested folder', () => {
    silenceOutput()
    const root = makeTree()
    const output = path.join(root, 'build', 'nested')

    generate({ args: { cwd: root, output } })

    expect(existsSync(path.join(output, 'docs-routes.json'))).toBe(true)
    expect(existsSync(path.join(root, 'docs-routes.json'))).toBe(false)
  })
})

describe('docs folder', () => {
  test.each([false, true])('a missing docs folder warns and writes empty lists (strict: %s)', (strict) => {
    const { warn } = silenceOutput()
    const root = makeTempDir()

    writeFileSync(path.join(root, 'package.json'), '{}')

    const result = generate({ args: { cwd: root, strict } })

    expect(result).toEqual({
      sections: [],
      section_labels: {},
      private_sections: [],
      public_exceptions: [],
      private_pages: [],
    })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('content/docs not found'))
    expect(JSON.parse(readFileSync(path.join(root, 'docs-routes.json'), 'utf8'))).toEqual(result)
  })

  test('args.docs takes precedence over context.contentDir', () => {
    silenceOutput()

    const root = makeTree({
      'a/meta.json': createMeta({ root: true }),
    })

    const other = path.join(root, 'other')

    mkdirSync(path.join(other, 'b'), { recursive: true })
    writeFileSync(path.join(other, 'b', 'meta.json'), createMeta({ root: true }))

    const result = generate({
      args: { cwd: root, docs: other },
      context: { contentDir: path.join(root, 'content', 'docs') },
    })

    expect(result.sections).toEqual(['b'])
  })

  test('context.contentDir is used when args.docs is not set', () => {
    silenceOutput()

    const root = makeTree()
    const other = path.join(root, 'other')

    mkdirSync(path.join(other, 'b'), { recursive: true })
    writeFileSync(path.join(other, 'b', 'meta.json'), createMeta({ root: true }))

    expect(generate({ args: { cwd: root }, context: { contentDir: other } }).sections).toEqual(['b'])
  })
})
