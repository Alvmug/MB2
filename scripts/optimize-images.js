const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

async function optimize() {
  console.log("🚀 Starting image optimization...");
  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const ext = path.extname(file).toLowerCase();
    
    // Ignore non-image files
    if (!fs.statSync(filePath).isFile()) continue;
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') continue;

    const stats = fs.statSync(filePath);
    const sizeMb = stats.size / (1024 * 1024);
    
    // Skip if already small (under 150kb)
    if (stats.size < 150000 && !file.toLowerCase().includes('logo') && !file.toLowerCase().includes('favicon')) {
      console.log(`- Skipping ${file} (already small: ${(stats.size / 1024).toFixed(1)} KB)`);
      continue;
    }
    
    console.log(`📦 Optimizing ${file} (${sizeMb.toFixed(2)} MB)...`);
    const tempPath = filePath + '.tmp';
    
    try {
      let width = 600; // Product images don't need to be wider than 600px
      let quality = 75;
      
      const lowerFile = file.toLowerCase();
      if (lowerFile.includes('favicon')) {
        width = 64;
        quality = 80;
      } else if (lowerFile.includes('logo')) {
        width = 200;
        quality = 85;
      }
      
      // Perform resize and compression using Sharp
      if (ext === '.png') {
        await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .png({ quality: quality, compressionLevel: 9 })
          .toFile(tempPath);
      } else {
        await sharp(filePath)
          .resize({ width: width, withoutEnlargement: true })
          .jpeg({ quality: quality, mozjpeg: true })
          .toFile(tempPath);
      }
      
      // Replace original file with optimized file
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      
      const newStats = fs.statSync(filePath);
      const newSizeKb = newStats.size / 1024;
      console.log(`✅ Optimized ${file} down to ${newSizeKb.toFixed(1)} KB`);
    } catch (err) {
      console.error(`❌ Failed to optimize ${file}:`, err);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
  console.log("🎉 Image optimization complete!");
}

optimize();
