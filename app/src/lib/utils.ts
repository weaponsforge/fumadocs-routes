import { existsSync } from 'node:fs'
import path from 'node:path'

import type { RawData } from './types.js'

/**
 * Finds the root of the project the generator runs in: the nearest folder,
 * from `startDir` upwards, that has a `package.json`. Falls back to `startDir`.
 * Uses the working directory instead of this file's location, because the
 * package is installed in the consuming project's `node_modules`.
 * @param {string} [startDir] - folder to start from, defaults to `process.cwd()`
 * @returns {string} absolute folder path
 */
export const findRootDir = (startDir: string = process.cwd()): string => {
  const start = path.resolve(startDir)
  let dir = start

  while (true) {
    if (existsSync(path.join(dir, 'package.json'))) return dir

    const parent = path.dirname(dir)
    if (parent === dir) return start

    dir = parent
  }
}

/**
 * Converts an absolute path to a forward-slash path relative to the app root
 * @param {string} filePath - absolute file or folder path
 * @param {string} [rootDir] - folder to make the path relative to, defaults to `findRootDir()`
 * @returns {string} eg. `content/docs/secrets/meta.json`
 */
export const toPosix = (filePath: string, rootDir: string = findRootDir()): string => {
  return path.relative(rootDir, filePath).split(path.sep).join('/')
}

/**
 * Checks whether a folder name is a Fumadocs group, eg. `(classes)`.
 * Groups add no URL segment.
 * @param {string} name - folder name (not a path)
 * @returns {boolean}
 */
export const isGroup = (name: string): boolean => {
  return /^\(.+\)$/.test(name)
}

/**
 * Type guard for a string with at least one non-whitespace character.
 * @param {unknown} value - any value, eg. a raw `description` field
 * @returns {boolean}
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * Joins URL segments into a docs-relative slug, skipping empty segments.
 * @param {string[]} segments - URL segments, eg. `['characters', 'elf']`
 * @returns {string} eg. `characters/elf`, or `''` for the docs root
 */
export const joinSlug = (segments: string[]): string => {
  return segments.filter(Boolean).join('/')
}

/**
 * Extracts a readable message from a caught value, which may not be an `Error`.
 * @param {unknown} error - value from a `catch` clause
 * @returns {string}
 */
export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Normalizes parsed JSON or YAML to an object.
 * Non-object results (`null`, strings, numbers) become `{}`.
 * @param {unknown} data - parsed `meta.json` or frontmatter
 * @returns {RawData}
 */
export const toRawData = (data: unknown): RawData => {
  return data && typeof data === 'object' ? data as RawData : {}
}

/**
 * Returns a deduplicated, sorted copy of a list, so the generated JSON is deterministic.
 * Does not modify the input.
 * @param {string[]} list - slugs or section names
 * @returns {string[]}
 */
export const sorted = (list: string[]): string[] => {
  return [...new Set(list)].sort()
}

/**
 * Formats a list of slugs for the console summary.
 * The root slug `''` is shown as `(root)`, and an empty list as `-`.
 * @param {string[]} list - slugs
 * @returns {string} eg. `secrets, stats-calculator`
 */
export const formatList = (list: string[]): string => {
  return list.map((slug) => slug || '(root)').join(', ') || '-'
}
