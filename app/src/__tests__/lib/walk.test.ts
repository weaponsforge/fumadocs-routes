import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { createMeta, createPage, makeTree } from '@/__tests__/helpers/makeTree.js'
import { Diagnostics } from '@/lib/classes/diagnostics.js'
import { Reader } from '@/lib/classes/reader.js'
import { RoutesCollection } from '@/lib/classes/routes.js'
import { walk } from '@/lib/walk.js'

/**
 * Walks a temporary docs tree and returns the lists `walk()` fills
 * @param {Record<string, string>} files - file contents by path relative to `content/docs`
 * @returns the private/public lists
 */
const runWalk = (files: Record<string, string>) => {
  const rootDir = makeTree(files)
  const contentDir = path.join(rootDir, 'content', 'docs')
  const diagnostics = new Diagnostics()
  const routes = new RoutesCollection()
  const reader = new Reader(diagnostics, rootDir)

  walk({
    context: { diagnostics, reader, routes, contentDir, rootDir },
    dir: contentDir,
    urlSegments: [],
    inheritedPrivate: false,
    isCovered: false,
  })

  const output = routes.toJSON()

  return {
    privateSections: output.private_sections,
    publicExceptions: output.public_exceptions,
    privatePages: output.private_pages,
    hasErrors: diagnostics.hasErrors(),
  }
}

describe('private folders', () => {
  test('a private folder is a prefix and its public pages are exceptions', () => {
    const result = runWalk({
      'secrets/meta.json': createMeta({ private: true }),
      'secrets/index.mdx': createPage(false),
      'secrets/open.mdx': createPage(false),
      'secrets/hidden.mdx': createPage(),
    })

    expect(result.privateSections).toEqual(['secrets'])
    expect(result.publicExceptions).toEqual(['secrets', 'secrets/open'])
    expect(result.privatePages).toEqual([])
  })

  test('only the topmost private folder becomes a prefix', () => {
    const result = runWalk({
      'a/meta.json': createMeta({ private: true }),
      'a/b/meta.json': createMeta({ private: true }),
      'a/b/page.mdx': createPage(true),
      'a/page.mdx': createPage(),
    })

    expect(result.privateSections).toEqual(['a'])
    expect(result.publicExceptions).toEqual([])
    expect(result.privatePages).toEqual([])
  })

  test('a private folder inside a public section is a nested prefix', () => {
    const result = runWalk({
      'characters/meta.json': createMeta({ root: true }),
      'characters/index.mdx': createPage(),
      'characters/wizards/meta.json': createMeta({ private: true }),
      'characters/wizards/index.mdx': createPage(),
      'characters/wizards/open.mdx': createPage(false),
    })

    expect(result.privateSections).toEqual(['characters/wizards'])
    expect(result.publicExceptions).toEqual(['characters/wizards/open'])
    expect(result.privatePages).toEqual([])
  })

  test('an explicit private: false folder inside a private one is not a prefix', () => {
    const result = runWalk({
      'x/meta.json': createMeta({ private: true }),
      'x/y/meta.json': createMeta({ private: false }),
      'x/y/page.mdx': createPage(),
    })

    expect(result.privateSections).toEqual(['x'])
    expect(result.publicExceptions).toEqual(['x/y/page'])
  })

  test('a private page under a private folder overrides nothing', () => {
    const result = runWalk({
      'x/meta.json': createMeta({ private: true }),
      'x/page.mdx': createPage(true),
    })

    expect(result.privateSections).toEqual(['x'])
    expect(result.publicExceptions).toEqual([])
    expect(result.privatePages).toEqual([])
  })

  test('a private root meta.json gates the whole docs root with the "" prefix', () => {
    const result = runWalk({
      'meta.json': createMeta({ private: true }),
      'open.mdx': createPage(false),
      'closed.mdx': createPage(),
    })

    expect(result.privateSections).toEqual([''])
    expect(result.publicExceptions).toEqual(['open'])
    expect(result.privatePages).toEqual([])
  })
})

describe('private pages', () => {
  test('a private page in a public section is listed', () => {
    const result = runWalk({
      'weapons/meta.json': createMeta({ root: true }),
      'weapons/index.mdx': createPage(),
      'weapons/secret.mdx': createPage(true),
      'weapons/open.mdx': createPage(false),
    })

    expect(result.privateSections).toEqual([])
    expect(result.publicExceptions).toEqual([])
    expect(result.privatePages).toEqual(['weapons/secret'])
  })

  test('a root-level private index page has the "" slug', () => {
    const result = runWalk({ 'index.mdx': createPage(true) })

    expect(result.privatePages).toEqual([''])
  })

  test('an index page takes the slug of its folder', () => {
    const result = runWalk({ 'weapons/index.mdx': createPage(true) })

    expect(result.privatePages).toEqual(['weapons'])
  })

  test('.md and .mdx pages count, other files are ignored', () => {
    const result = runWalk({
      'a/doc.md': createPage(true),
      'a/doc2.mdx': createPage(true),
      'a/data.json': '{"private":true}',
      'a/image.png': 'x',
      'a/notes.txt': '---\nprivate: true\n---\n',
    })

    expect(result.privatePages).toEqual(['a/doc', 'a/doc2'])
  })

  test('a private page saved with a UTF-8 BOM is still private', () => {
    const result = runWalk({
      'weapons/meta.json': createMeta({ root: true }),
      'weapons/secret.mdx': `\uFEFF${createPage(true)}`,
    })

    expect(result.privatePages).toEqual(['weapons/secret'])
    expect(result.hasErrors).toBe(false)
  })

  test('a private meta.json saved with a UTF-8 BOM still gates its folder', () => {
    const result = runWalk({
      'secrets/meta.json': `\uFEFF${createMeta({ private: true })}`,
      'secrets/index.mdx': createPage(),
    })

    expect(result.privateSections).toEqual(['secrets'])
    expect(result.hasErrors).toBe(false)
  })
})

describe('group folders', () => {
  test('a group adds no URL segment', () => {
    const result = runWalk({
      'characters/(classes)/elf.mdx': createPage(true),
      'characters/(classes)/knight.mdx': createPage(),
    })

    expect(result.privatePages).toEqual(['characters/elf'])
  })

  test('a private group is never a prefix, its pages are listed one by one', () => {
    const result = runWalk({
      '(extra)/meta.json': createMeta({ private: true }),
      '(extra)/readme.mdx': createPage(),
      '(extra)/open.mdx': createPage(false),
    })

    expect(result.privateSections).toEqual([])
    expect(result.privatePages).toEqual(['readme'])
    expect(result.publicExceptions).toEqual([])
  })

  test('a non-group folder inside a private group becomes the prefix', () => {
    const result = runWalk({
      '(extra)/meta.json': createMeta({ private: true }),
      '(extra)/items/meta.json': createMeta({ root: true }),
      '(extra)/items/index.mdx': createPage(),
      '(extra)/items/open.mdx': createPage(false),
    })

    expect(result.privateSections).toEqual(['items'])
    expect(result.publicExceptions).toEqual(['items/open'])
    expect(result.privatePages).toEqual([])
  })

  test('a private group inside a public section lists its pages and prefixes its folders', () => {
    const result = runWalk({
      'weapons/meta.json': createMeta({ root: true }),
      'weapons/(secret)/meta.json': createMeta({ private: true }),
      'weapons/(secret)/page.mdx': createPage(),
      'weapons/(secret)/deep/page.mdx': createPage(),
    })

    expect(result.privateSections).toEqual(['weapons/deep'])
    expect(result.privatePages).toEqual(['weapons/page'])
  })

  test('a public group page can sit next to private siblings', () => {
    const result = runWalk({
      'guide/meta.json': createMeta({ root: true }),
      'guide/(basics)/intro.mdx': createPage(false),
      'guide/(basics)/advanced.mdx': createPage(true),
    })

    expect(result.privatePages).toEqual(['guide/advanced'])
    expect(result.publicExceptions).toEqual([])
  })
})

describe('output', () => {
  test('is deterministic regardless of the order files are created in', () => {
    const files = {
      'b/meta.json': createMeta({ private: true }),
      'b/open.mdx': createPage(false),
      'a/meta.json': createMeta({ private: true }),
      'a/open.mdx': createPage(false),
      'c/z.mdx': createPage(true),
      'c/y.mdx': createPage(true),
    }
    const reversed = Object.fromEntries(Object.entries(files).reverse())

    expect(runWalk(reversed)).toEqual(runWalk(files))
    expect(runWalk(files).privateSections).toEqual(['a', 'b'])
    expect(runWalk(files).privatePages).toEqual(['c/y', 'c/z'])
  })

  test('an invalid private value is an error and the page inherits', () => {
    const result = runWalk({
      'secrets/meta.json': createMeta({ private: true }),
      'secrets/page.mdx': createPage('"yes"'),
    })

    expect(result.hasErrors).toBe(true)
    expect(result.privateSections).toEqual(['secrets'])
    expect(result.publicExceptions).toEqual([])
  })
})
