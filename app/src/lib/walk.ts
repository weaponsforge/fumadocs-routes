import { readdirSync } from 'node:fs'
import path from 'node:path'

import { PAGE_EXTENSIONS } from '@/utils/constants.js'
import {
  isGroup,
  joinSlug,
} from '@/utils/helpers.js'

import type { IWalkParams } from '@/types.js'

/**
 * Walks a content folder and fills the private/public lists.
 * @param {GeneratorContext} context - run instances
 * @param {string} dir - absolute folder path
 * @param {string[]} urlSegments - URL segments of the folder (groups excluded)
 * @param {boolean} inheritedPrivate - effective privacy of the parent folder
 * @param {boolean} isCovered - whether a `private_sections` prefix already covers this folder
 */
export const walk = ({
  context,
  dir,
  urlSegments,
  inheritedPrivate,
  isCovered,
}: IWalkParams): void => {
  const { reader, routes, contentDir } = context

  const name = path.basename(dir)
  const isGroupDir = dir !== contentDir && isGroup(name)
  const meta = reader.readMeta(dir)
  const metaPrivate = reader.readPrivate(meta, path.join(dir, 'meta.json'))
  const isPrivate = metaPrivate ?? inheritedPrivate
  const folderSlug = joinSlug(urlSegments)

  // Topmost private non-group folder becomes a URL prefix. Group folders add no
  // URL segment, so their pages are listed one by one in `private_pages`.
  let covered = isCovered

  if (isPrivate && !isCovered && !isGroupDir) {
    routes.addPrivateSection(folderSlug)
    covered = true
  }

  const entries = readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const childSegments = isGroup(entry.name)
        ? urlSegments
        : [...urlSegments, entry.name]

      walk({
        context,
        dir: entryPath,
        urlSegments: childSegments,
        inheritedPrivate: isPrivate,
        isCovered: covered,
      })

      continue
    }

    const extension = path.extname(entry.name)
    if (!entry.isFile() || !PAGE_EXTENSIONS.includes(extension)) continue

    const baseName = path.basename(entry.name, extension)
    const pagePrivate = reader.readPrivate(reader.readFrontmatter(entryPath), entryPath) ?? isPrivate
    const pageSlug = baseName === 'index'
      ? folderSlug
      : joinSlug([...urlSegments, baseName])

    if (covered && !pagePrivate) {
      routes.addPublicException(pageSlug)
    } else if (!covered && pagePrivate) {
      routes.addPrivatePage(pageSlug)
    }
  }
}
