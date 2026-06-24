/*
 * Rasterize public/favicon.svg into the PWA icon set (run: npm run icons).
 * The source is a full-bleed warm amber field with a lit node, so every size —
 * including maskable — keeps a coloured field to the edges and never vanishes
 * on a light system wallpaper.
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'))

const targets = [
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/pwa-512x512.png', size: 512 },
  { file: 'public/maskable-512x512.png', size: 512 },
  { file: 'public/apple-touch-icon-180x180.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(root, file))
  console.log('wrote', file, `(${size}x${size})`)
}
