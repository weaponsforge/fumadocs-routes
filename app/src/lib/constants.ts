import path from 'node:path'

export const OUTPUT_FILE_NAME = 'docs-routes.json'

// Default docs folder, relative to the root folder
export const DEFAULT_DOCS_PATH = path.join('content', 'docs')

export const PAGE_EXTENSIONS = ['.mdx', '.md']
export const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
