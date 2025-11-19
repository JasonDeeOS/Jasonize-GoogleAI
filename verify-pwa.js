import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const manifestPath = path.join(distDir, 'manifest.webmanifest');
const swPath = path.join(distDir, 'sw.js');

console.log('🔍 Starting PWA Verification...\n');

// 1. Verify Manifest
if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest file not found at', manifestPath);
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
const missingFields = requiredFields.filter(field => !manifest[field]);

if (missingFields.length > 0) {
    console.error('❌ Missing required manifest fields:', missingFields.join(', '));
} else {
    console.log('✅ Manifest contains all required fields.');
}

// Check Icons
const hasLargeIcon = manifest.icons?.some(icon => icon.sizes === '512x512' && icon.type === 'image/png');
const hasMaskableIcon = manifest.icons?.some(icon => icon.purpose?.includes('maskable'));

if (hasLargeIcon) console.log('✅ 512x512 icon present.');
else console.error('❌ Missing 512x512 icon.');

if (hasMaskableIcon) console.log('✅ Maskable icon present.');
else console.warn('⚠️ Maskable icon recommended but missing (checked purpose field).');

if (manifest.display === 'standalone' || manifest.display === 'fullscreen') {
    console.log(`✅ Display mode is '${manifest.display}'.`);
} else {
    console.error(`❌ Display mode should be 'standalone' or 'fullscreen', found '${manifest.display}'.`);
}

// 2. Verify Service Worker
if (!fs.existsSync(swPath)) {
    console.error('❌ Service Worker file not found at', swPath);
} else {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    // Check for Workbox usage or fetch handler
    if (swContent.includes('workbox') || swContent.includes('fetch')) {
        console.log('✅ Service Worker seems to contain Workbox/fetch logic.');
    } else {
        console.warn('⚠️ Service Worker might be missing fetch handler (could not find "workbox" or "fetch" string).');
    }
}

console.log('\n🎉 Verification Complete.');
