import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import {
  isStrict,
  PAGE_EXTENSIONS,
} from './constants.js'
import { isGroup, isNonEmptyString, toPosix } from './utils.js'

import type { GeneratorContext } from './types.js'

/**
 * Lists the folders that sit at the top level of the docs URL space: the
 * non-group children of `dir`, plus those inside top-level group folders,
 * eg. `content/docs/(extra)/items` is served at `/docs/items`.
 * @param {string} dir - folder to list, the docs content folder or a top-level group folder in it
 * @returns {string[]} absolute folder paths
 */
const listTopLevelFolders = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))

  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)

    return isGroup(entry.name)
      ? listTopLevelFolders(entryPath)
      : [entryPath]
  })
}

/**
 * Collects the top-level sections: folders whose meta.json has `root: true` and
 * whose URL is `/docs/<folder>`, including folders inside top-level groups.
 * Nested `root: true` folders, eg. `characters/classes`, are not sections:
 * `getSection()` only keys on the first URL segment.
 * @param {GeneratorContext} context - run instances
 */
export const collectSections = ({
  diagnostics,
  reader,
  routes,
  contentDir,
  strict = isStrict,
}: GeneratorContext) => {
  for (const dir of listTopLevelFolders(contentDir)) {
    const folder = path.basename(dir)
    const relativeDir = toPosix(dir)
    const meta = reader.readMeta(dir)

    if (!meta) {
      const message =
        `${relativeDir} has no meta.json, so it is not a section and its pages fall back to the "characters" section. ` +
        `Add ${relativeDir}/meta.json with "title", "root": true, "description", "icon" and "pages".`

      if (strict) {
        diagnostics.addError(message)
      } else {
        diagnostics.addWarning(message)
      }

      continue
    }

    if (meta.root !== true) continue

    const indexFile = PAGE_EXTENSIONS
      .map((extension) => path.join(dir, `index${extension}`))
      .find((file) => existsSync(file))

    const indexDescription = indexFile ? reader.readFrontmatter(indexFile).description : undefined
    const label = [meta.description, indexDescription].find(isNonEmptyString) ?? folder

    routes.addSection(folder, label.trim())
  }
}
