import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'

import { FRONTMATTER_REGEX } from '@/utils/constants.js'
import {
  findRootDir,
  getErrorMessage,
  stripBom,
  toPosix,
  toRawData,
} from '@/utils/helpers.js'

import type { RawData } from '@/types.js'
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
   * Reads a file as UTF-8 text without a leading BOM,
   * which would hide the frontmatter and break `JSON.parse`.
   */
  private readText (file: string, isStripBom: boolean = true): string {
    return isStripBom
      ? stripBom(readFileSync(file, 'utf8'))
      : readFileSync(file, 'utf8')
  }

  /**
   * Returns the parsed meta.json of a folder, or `null` if it has none.
   */
  readMeta (dir: string): RawData | null {
    const file = path.join(dir, 'meta.json')
    if (!existsSync(file)) return null

    try {
      return toRawData(
        JSON.parse(this.readText(file)),
      )
    } catch (error) {
      const errMsg = `${toPosix(file, this.rootDir)}: invalid JSON (${getErrorMessage(error)})`
      this.diagnostics.addError(errMsg)

      return {}
    }
  }

  /**
   * Returns the raw (not zod-parsed) frontmatter of a page.
   */
  readFrontmatter (file: string): RawData {
    try {
      const yaml = this.readText(file).match(FRONTMATTER_REGEX)?.[1]
      if (yaml === undefined) return {}

      return toRawData(loadYaml(yaml))
    } catch (error) {
      const errMsg = `${toPosix(file, this.rootDir)}: invalid frontmatter (${getErrorMessage(error)})`
      this.diagnostics.addError(errMsg)

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
      const errMsg = `${toPosix(file, this.rootDir)}: "private" must be true or false, got ${JSON.stringify(value)}`
      this.diagnostics.addError(errMsg)

      return undefined
    }

    return value
  }
}
