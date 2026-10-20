import { execSync } from 'node:child_process'

import { getAppVersion } from '@/utils/helpers.js'

export const envInfo = (): void => {
  console.log('App version:', getAppVersion())
  console.log('Node version:', process.version)
  console.log('Platform:', process.platform)
  console.log('Arch:', process.arch)
  console.log('V8 version:', process.versions.v8)

  try {
    console.log('npm version:', execSync('npm -v').toString().trim())
  } catch {
    console.log('npm version: unavailable')
  }
}
