/**
 * Copy the knowledge base markdown into dist as part of the build.
 *
 * tsc only emits JavaScript, and the production image ships dist rather than
 * src, so without this step src/services/ai/kb/support.md exists in
 * development and is missing in the container. The failure would not surface
 * until someone reindexed against the deployed service.
 *
 * A script file rather than an inline node -e in package.json because the
 * quoting for that differs between cmd.exe and sh, and the build runs on both.
 */
const fs = require('fs')
const path = require('path')

const from = path.join(__dirname, '..', 'src', 'services', 'ai', 'kb')
const to = path.join(__dirname, '..', 'dist', 'services', 'ai', 'kb')

if (!fs.existsSync(from)) {
  console.error(`ERROR: knowledge base source directory is missing: ${from}`)
  process.exit(1)
}

fs.cpSync(from, to, { recursive: true })
console.log(`Copied knowledge base markdown to ${to}`)
