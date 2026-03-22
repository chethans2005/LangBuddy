import { cp, mkdir } from 'fs/promises';
import path from 'path';

async function main() {
  try {
    const src = path.resolve('frontend', 'dist');
    const dest = path.resolve('backend', 'frontend', 'dist');

    // ensure destination directory exists
    await mkdir(path.dirname(dest), { recursive: true });

    // copy dist -> backend/frontend/dist
    await cp(src, dest, { recursive: true });

    console.log(`Copied ${src} -> ${dest}`);
  } catch (err) {
    console.error('Error copying frontend dist to backend:', err);
    process.exit(1);
  }
}

main();
