import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { Diagnostics } from '@/lib/classes/diagnostics.js'
import { Reader } from '@/lib/classes/reader.js'
import { RoutesCollection } from '@/lib/classes/routes-collection.js'
import {
  CONTENT_DIR,
  ROOT_DIR,
  OUTPUT_FILE_NAME,
} from '@/lib/constants.js'
import { collectSections } from '@/lib/section.js'
import {
  formatList,
  toPosix,
} from '@/lib/utils.js'
import { walk } from '@/lib/walk.js'
import type { GeneratorContext, IDocsRoutes } from '@/lib/types.js'

/** Relative paths resolve from the working directory */
export interface IGenerateArgs {
  /** Fumadocs docs folder. Default: `<root>/content/docs` */
  docs?: string;
  /** Folder for `docs-routes.json`. Default: `<root>` */
  output?: string;
  /** Error on top-level folders without `meta.json`. Default: `--strict` flag */
  strict?: boolean;
}

export interface IGenerateRoutes {
  context?: Partial<GeneratorContext>;
  args?: IGenerateArgs;
}

/**
 * Resolves the output folder and checks that it is not a file path.
 * @param {string} [outputDir] - folder from `--output`, defaults to `ROOT_DIR`
 * @throws {Error} when the path is an existing file or ends in `.json`
 * @returns {string} absolute path of `docs-routes.json` in that folder
 */
const resolveOutputFile = (outputDir: string = ROOT_DIR) => {
  const dir = path.resolve(outputDir)
  const isFile = existsSync(dir) && !statSync(dir).isDirectory()

  if (isFile || path.extname(dir).toLowerCase() === '.json') {
    throw new Error(
      `[routes:generate] --output expects a folder, got ${toPosix(dir)}. ` +
      `The file is always named ${OUTPUT_FILE_NAME}.`,
    )
  }

  return path.join(dir, OUTPUT_FILE_NAME)
}

/**
 * @file Entry point of the docs route generator.
 * @description Generates `docs-routes.json` from the `private` flags in the
 * Fumadocs docs folder (`meta.json` for folders, frontmatter for pages).
 * `<root>` is the nearest folder with a `package.json`, from the working directory upwards.
 *
 * CLI usage (after `npm run build`):
 * - `fumadocs-routes [--docs <dir>] [--output <dir>] [--strict]`
 * - `--strict`: a top-level folder without `meta.json` is an error instead of a warning (CI gates)
 *
 * @throws {Error} when the content has validation errors (they are printed to stderr first)
 * @returns {IDocsRoutes} the written route lists
 */
export const generate = ({ context, args = {} }: IGenerateRoutes = {}): IDocsRoutes => {
  const contentDir = path.resolve(args.docs ?? context?.contentDir ?? CONTENT_DIR)
  const outputFile = resolveOutputFile(args.output)
  const diagnostics = context?.diagnostics ?? new Diagnostics()

  const localContext: GeneratorContext = {
    diagnostics,
    reader: context?.reader ?? new Reader(diagnostics),
    routes: context?.routes ?? new RoutesCollection(),
    contentDir,
    strict: args.strict ?? context?.strict,
  }

  if (existsSync(contentDir)) {
    collectSections(localContext)

    walk({
      context: localContext,
      dir: contentDir,
      urlSegments: [],
      inheritedPrivate: false,
      isCovered: false,
    })
  } else {
    diagnostics.addWarning(`${toPosix(contentDir)} not found, writing empty route lists`)
  }

  diagnostics.flush()

  if (diagnostics.hasErrors()) {
    throw new Error('[routes:generate] failed, see the errors above')
  }

  const output = localContext.routes.toJSON()

  mkdirSync(path.dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`)

  process.stdout.write([
    `[routes:generate] wrote ${toPosix(outputFile)}`,
    `  sections (${output.sections.length}): ${formatList(output.sections)}`,
    `  private_sections (${output.private_sections.length}): ${formatList(output.private_sections)}`,
    `  public_exceptions (${output.public_exceptions.length}): ${formatList(output.public_exceptions)}`,
    `  private_pages (${output.private_pages.length}): ${formatList(output.private_pages)}`,
    '',
  ].join('\n'))

  return output
}
