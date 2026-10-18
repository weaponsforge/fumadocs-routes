import path from 'node:path'

import { findRootDir } from './utils.js'

export const ROOT_DIR = findRootDir()
export const OUTPUT_FILE_NAME = 'docs-routes.json'

export const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'docs')

export const PAGE_EXTENSIONS = ['.mdx', '.md']
export const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

export const isStrict = process.argv.includes('--strict')
