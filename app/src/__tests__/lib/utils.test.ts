import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  findRootDir,
  formatList,
  getErrorMessage,
  isGroup,
  isNonEmptyString,
  joinSlug,
  sorted,
  toPosix,
  toRawData,
} from '@/lib/utils.js'

describe('isGroup', () => {
  test.each(['(classes)', '(a)', '(my group)'])('%s is a group', (name) => {
    expect(isGroup(name)).toBe(true)
  })

  test.each(['', '()', 'classes', '(classes', 'classes)', 'a(b)', '(a)b'])('"%s" is not a group', (name) => {
    expect(isGroup(name)).toBe(false)
  })
})

describe('joinSlug', () => {
  test('joins segments with /', () => {
    expect(joinSlug(['characters', 'elf'])).toBe('characters/elf')
  })

  test('skips empty segments', () => {
    expect(joinSlug(['', 'a', '', 'b'])).toBe('a/b')
  })

  test('returns "" for the docs root', () => {
    expect(joinSlug([])).toBe('')
    expect(joinSlug([''])).toBe('')
  })
})

describe('sorted', () => {
  test('sorts and deduplicates', () => {
    expect(sorted(['b', 'a', 'b', 'c', 'a'])).toEqual(['a', 'b', 'c'])
  })

  test('does not modify the input', () => {
    const input = ['b', 'a', 'b']

    sorted(input)

    expect(input).toEqual(['b', 'a', 'b'])
  })

  test('returns [] for an empty list', () => {
    expect(sorted([])).toEqual([])
  })
})

describe('formatList', () => {
  test('joins slugs with a comma', () => {
    expect(formatList(['secrets', 'stats-calculator'])).toBe('secrets, stats-calculator')
  })

  test('shows the root slug as (root)', () => {
    expect(formatList(['', 'a'])).toBe('(root), a')
  })

  test('shows an empty list as -', () => {
    expect(formatList([])).toBe('-')
  })
})

describe('toPosix', () => {
  test('returns a root-relative path with forward slashes', () => {
    const root = path.resolve('some', 'root')

    expect(toPosix(path.join(root, 'content', 'docs', 'meta.json'), root)).toBe('content/docs/meta.json')
  })

  test('uses .. for paths outside the root', () => {
    const root = path.resolve('some', 'root')

    expect(toPosix(path.resolve('some', 'other'), root)).toBe('../other')
  })
})

describe('findRootDir', () => {
  test('finds the nearest folder with a package.json, searching upwards', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'routes-'))
    const nested = path.join(root, 'a', 'b', 'c')

    mkdirSync(nested, { recursive: true })
    writeFileSync(path.join(root, 'package.json'), '{}')

    expect(findRootDir(nested)).toBe(root)
  })

  test('prefers the nearest package.json', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'routes-'))
    const inner = path.join(root, 'packages', 'inner')

    mkdirSync(inner, { recursive: true })
    writeFileSync(path.join(root, 'package.json'), '{}')
    writeFileSync(path.join(inner, 'package.json'), '{}')

    expect(findRootDir(path.join(inner, 'src'))).toBe(inner)
  })

  test('returns the start folder itself when it has a package.json', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'routes-'))

    writeFileSync(path.join(root, 'package.json'), '{}')

    expect(findRootDir(root)).toBe(root)
  })

  test('falls back to the start folder when no package.json is found', () => {
    // The temp folder is outside any project, but a package.json could exist above it on some machines
    const start = path.resolve(path.parse(os.tmpdir()).root)

    expect(findRootDir(start)).toBe(start)
  })
})

describe('toRawData', () => {
  test('returns objects as they are', () => {
    const data = { private: true }

    expect(toRawData(data)).toBe(data)
  })

  test.each([null, undefined, 'text', 42, true])('turns %j into {}', (value) => {
    expect(toRawData(value)).toEqual({})
  })
})

describe('isNonEmptyString', () => {
  test.each(['a', ' a ', '0'])('"%s" is a non-empty string', (value) => {
    expect(isNonEmptyString(value)).toBe(true)
  })

  test.each(['', '   ', '\n\t', 42, null, undefined, {}, []])('%j is not', (value) => {
    expect(isNonEmptyString(value)).toBe(false)
  })
})

describe('getErrorMessage', () => {
  test('returns the message of an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  test('stringifies other thrown values', () => {
    expect(getErrorMessage('plain')).toBe('plain')
    expect(getErrorMessage(42)).toBe('42')
    expect(getErrorMessage(null)).toBe('null')
  })
})
