import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const iconSource = fileURLToPath(new URL('../public/app-icon.png', import.meta.url))
const splashSource = fileURLToPath(new URL('../public/mirza-logo.png', import.meta.url))
const assetPath = name => fileURLToPath(new URL(`../assets/${name}`, import.meta.url))
const assets = fileURLToPath(new URL('../assets/', import.meta.url))

await mkdir(assets, { recursive: true })

const icon = sharp(iconSource)
const metadata = await icon.metadata()
if (metadata.width !== metadata.height || metadata.width < 1024) {
  throw new Error('public/app-icon.png must be a square PNG at least 1024x1024.')
}

const splash = sharp(splashSource)
const splashMetadata = await splash.metadata()
if (!splashMetadata.width || !splashMetadata.height) {
  throw new Error('public/mirza-logo.png must be a valid image file.')
}

await sharp(iconSource).resize(1024, 1024, { fit: 'contain', background: '#ffffff' }).png().toFile(assetPath('icon-only.png'))
await sharp(iconSource).resize(1024, 1024, { fit: 'contain', background: '#ffffff' }).png().toFile(assetPath('icon-foreground.png'))
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff' } }).png().toFile(assetPath('icon-background.png'))
await sharp(splashSource)
  .resize(1024, 1024, { fit: 'contain', background: '#000000' })
  .extend({ top: 854, bottom: 854, left: 854, right: 854, background: '#000000' })
  .png()
  .toFile(assetPath('splash.png'))

console.log('Android icon assets prepared from public/app-icon.png')
console.log('Android splash asset prepared from public/mirza-logo.png')
