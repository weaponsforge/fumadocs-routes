#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { generate } from './main.js'

const { values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    docs: { // Path to the fumadocs "docs" folder eg., content/docs
      type: 'string',
      short: 'd',
    },
    output: { // Folder to write docs-routes.json into
      type: 'string',
      short: 'o',
    },
    strict: { // Top-level folders without meta.json are errors
      type: 'boolean',
      default: false,
    },
  },
})

const run = () => {
  try {
    generate({ args: values })
  } catch (error) {
    if (error instanceof Error) console.error(error.message)
    process.exit(1)
  }
}

if (process.env.IS_DOCKER) {
  setTimeout(run, 5000)
} else {
  run()
}
