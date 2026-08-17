#!/usr/bin/env node
/**
 * Remove Docker E2E test data from containerized MongoDB.
 * Safe to run anytime — only deletes records matching docker-e2e-test.mjs patterns.
 *
 *   node scripts/docker-e2e-cleanup.mjs                         # dev DB (smart_restaurant)
 *   E2E_MONGO_DB=smart_restaurant_e2e node scripts/docker-e2e-cleanup.mjs
 */
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CLEANUP_JS = fileURLToPath(new URL('./docker-e2e-cleanup.js', import.meta.url))
const E2E_MONGO_DB = process.env.E2E_MONGO_DB || 'smart_restaurant'

function main() {
  try {
    const script =
      `const E2E_MONGO_DB = ${JSON.stringify(E2E_MONGO_DB)};\n` + readFileSync(CLEANUP_JS, 'utf8')
    const out = execSync(
      `cd "${ROOT}" && docker compose exec -T mongodb mongosh --quiet --file /dev/stdin`,
      { encoding: 'utf8', input: script },
    ).trim()

    const summary = JSON.parse(out || '{}')
    const deleted = Object.entries(summary).filter(
      ([k, v]) => typeof v === 'number' && v > 0,
    )

    if (!deleted.length && !summary.found?.restaurants?.length) {
      console.log(`No Docker E2E test data in "${E2E_MONGO_DB}".`)
      return summary
    }

    console.log(`Cleaned database "${E2E_MONGO_DB}":`)
    if (summary.found) {
      for (const [col, items] of Object.entries(summary.found)) {
        if (items?.length) {
          console.log(`  Found ${col}:`)
          items.forEach((item) => console.log(`    ${JSON.stringify(item)}`))
        }
      }
    }
    for (const [key, count] of deleted) {
      console.log(`  removed ${key}: ${count}`)
    }
    return summary
  } catch (err) {
    console.error('E2E cleanup failed:', err.message || err)
    process.exit(1)
  }
}

main()
