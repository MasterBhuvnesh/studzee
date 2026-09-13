import fs from 'fs'
import path from 'path'

/**
 * SERVICE VERSION
 *
 * The release running right now, read off the manifest so the health probes
 * and the welcome route can name it. Health checks are how a deployment is
 * told apart from the previous one without signing in, which an admin only
 * route could never do.
 *
 * Resolved relative to this file rather than the working directory: two levels
 * up lands on package.json both under ts-node (src/config) and under the
 * compiled output (dist/config). Anything unparseable answers unknown rather
 * than failing the import, because a version string must never break boot.
 */
const readVersion = (): string => {
  try {
    const manifest = path.join(__dirname, '..', '..', 'package.json')
    const parsed = JSON.parse(fs.readFileSync(manifest, 'utf8')) as {
      version?: unknown
    }
    return typeof parsed.version === 'string' ? parsed.version : 'unknown'
  } catch {
    return 'unknown'
  }
}

export const SERVICE_VERSION = readVersion()
