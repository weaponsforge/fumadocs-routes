import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'

import { FRONTMATTER_REGEX } from '@/lib/constants.js'
import {
  findRootDir,
  getErrorMessage,
  toPosix,
  toRawData,
} from '@/lib/utils.js'

import type { RawData } from '@/lib/types.js'
import type { Diagnostics } from './diagnostics.js'

/**
 * Reads Fumadocs metadata, frontmatter and `private` values.
 * Parse and validation errors go to `diagnostics` instead of throwing.
 */
export class Reader {
  constructor (
    private readonly diagnostics: Diagnostics,
    private readonly rootDir: string = findRootDir(),
  ) {}

  /**
   * Returns the parsed meta.json of a folder, or `null` if it has none.
   */
  readMeta (dir: string): RawData | null {
    const file = path.join(dir, 'meta.json')
    if (!existsSync(file)) return null

    try {
      return toRawData(JSON.parse(readFileSync(file, 'utf8')))
    } catch (error) {
      this.diagnostics.addError(`${toPosix(file, this.rootDir)}: invalid JSON (${getErrorMessage(error)})`)

      return {}
    }
  }

  /**
   * Returns the raw (not zod-parsed) frontmatter of a page.
   */
  readFrontmatter (file: string): RawData {
    const yaml = readFileSync(file, 'utf8').match(FRONTMATTER_REGEX)?.[1]
    if (yaml === undefined) return {}

    try {
      return toRawData(loadYaml(yaml))
    } catch (error) {
      this.diagnostics.addError(`${toPosix(file, this.rootDir)}: invalid frontmatter (${getErrorMessage(error)})`)

      return {}
    }
  }

  /**
   * Returns the explicitly written `private` value, or `undefined` to inherit.
   */
  readPrivate (data: RawData | null, file: string): boolean | undefined {
    const value = data?.private
    if (value === undefined) return undefined

    if (typeof value !== 'boolean') {
      this.diagnostics.addError(`${toPosix(file, this.rootDir)}: "private" must be true or false, got ${JSON.stringify(value)}`)

      return undefined
    }

    return value
  }
}
