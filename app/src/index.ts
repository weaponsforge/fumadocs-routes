export { Diagnostics } from '@/lib/classes/diagnostics.js'
export { Reader } from '@/lib/classes/reader.js'
export { RoutesCollection } from '@/lib/classes/routes.js'

export { collectSections } from '@/lib/section.js'
export { generate } from '@/scripts/generate/main.js'
export { walk } from '@/lib/walk.js'

export { ROOT_DIR, CONTENT_DIR, OUTPUT_FILE_NAME } from '@/lib/constants.js'
export { findRootDir } from '@/lib/utils.js'

export type { IGenerateArgs, IGenerateRoutes } from '@/scripts/generate/main.js'
export type { GeneratorContext, IDocsRoutes, RawData } from '@/lib/types.js'
