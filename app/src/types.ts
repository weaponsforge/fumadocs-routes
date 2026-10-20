import type { Diagnostics } from '@/lib/classes/diagnostics.js'
import type { Reader } from '@/lib/classes/reader.js'
import type { RoutesCollection } from '@/lib/classes/routes.js'

/**
 * Parsed `meta.json` or frontmatter, before any validation
 */
export type RawData = Record<string, unknown>

/**
 * Shape of the generated `docs-routes.json`, also imported by `src/lib/routes/routes.ts`
 */
export interface IDocsRoutes {
  sections: string[]
  section_labels: Record<string, string>
  private_sections: string[]
  public_exceptions: string[]
  private_pages: string[]
}

/**
 * Per-run instances, created in `generate()` and passed to the collectors
 */
export interface GeneratorContext {
  diagnostics: Diagnostics
  reader: Reader
  routes: RoutesCollection
  /** Absolute path of the Fumadocs docs folder, eg. `<root>/content/docs` */
  contentDir: string
  /** Absolute path of the root folder (nearest `package.json`), used for relative paths in messages */
  rootDir: string
  /** Treat a top-level folder without `meta.json` as an error. Default: false */
  strict?: boolean
}

export interface IWalkParams {
  context: GeneratorContext;
  dir: string;
  urlSegments: string[];
  inheritedPrivate: boolean;
  isCovered: boolean;
}
