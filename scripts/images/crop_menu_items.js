#!/usr/bin/env node

/**
 * 🔥 MAD BURNING - MENU ITEM CROPPER (Node.js Version) 🔥
 * Automatically crops product images from menu grid
 */

const fs = require('fs');
const path = require('path');

// Install required package first
function checkDependencies() {
  try {
    require('sharp');
  } catch (e) {
    console.log('📦 Installing required dependency: sharp');
    console.log('Running: npm install sharp\n');
    require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
  }
}

async function cropMenuItems() {
  const sharp = require('sharp');
  
  const MENU_IMAGE = path.join(__dirname, '..', '..', 'public', 'assets', 'menu_full.png');
  const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'assets');
  
  // Check if image exists
  if (!fs.existsSync(MENU_IMAGE)) {
    console.error('❌ ERROR: menu_full.png not found');
    console.error(`Expected path: ${MENU_IMAGE}\n`);
    console.log('📝 STEPS:');
    console.log('1. Save your menu image as menu_full.png');
    console.log('2. Place it in: public/assets/\n');
    process.exit(1);
  }
  
  // Menu items with estimated crop coordinates (x, y, width, height)
  // These are approximate based on typical 5-column grid layout
  const CROP_ITEMS = [
    // Row 1: Plain items (no Fanta)
    { file: 'chicken_burger.jpg', name: 'Chicken Burger', x: 20, y: 40, w: 140, h: 140 },
    { file: 'beef_burger.jpg', name: 'Beef Burger', x: 170, y: 40, w: 140, h: 140 },
    { file: 'double_chicken_burger.jpg', name: 'Double Chicken Burger', x: 320, y: 40, w: 140, h: 140 },
    { file: 'fries.jpg', name: 'Fries', x: 470, y: 40, w: 140, h: 140 },
    { file: 'omelette_burger.jpg', name: 'Omelette Burger', x: 620, y: 40, w: 140, h: 140 },
    
    // Row 2: With Fanta
    { file: 'chicken_burger_fanta.jpg', name: 'Chicken Burger & Fanta', x: 20, y: 200, w: 140, h: 140 },
    { file: 'beef_burger_fanta.jpg', name: 'Beef Burger & Fanta', x: 170, y: 200, w: 140, h: 140 },
    { file: 'double_chicken_fanta.jpg', name: 'Double Chicken & Fanta', x: 320, y: 200, w: 140, h: 140 },
    { file: 'fries_fanta.jpg', name: 'Fries & Fanta', x: 470, y: 200, w: 140, h: 140 },
    { file: 'cheese_burger_fanta.jpg', name: 'Cheese Burger & Fanta', x: 620, y: 200, w: 140, h: 140 },
    
    // Row 3: Beef variants
    { file: 'beef_cheese_burger.jpg', name: 'Beef Cheese Burger', x: 20, y: 360, w: 140, h: 140 },
    { file: 'beef_burger_cheese.jpg', name: 'Beef Burger Cheese', x: 170, y: 360, w: 140, h: 140 },
    { file: 'fries_plain.jpg', name: 'Plain Fries', x: 320, y: 360, w: 140, h: 140 },
    { file: 'double_beef_burger.jpg', name: 'Double Beef Burger', x: 470, y: 360, w: 140, h: 140 },
    { file: 'loaded_fries.jpg', name: 'Loaded Fries', x: 620, y: 360, w: 140, h: 140 },
    
    // Row 4: More combos
    { file: 'beef_combo_1.jpg', name: 'Beef Combo 1', x: 20, y: 520, w: 140, h: 140 },
    { file: 'loaded_fries_2.jpg', name: 'Loaded Fries 2', x: 170, y: 520, w: 140, h: 140 },
    { file: 'beef_fanta_combo.jpg', name: 'Beef & Fanta Combo', x: 320, y: 520, w: 140, h: 140 },
    { file: 'double_beef_fanta.jpg', name: 'Double Beef & Fanta', x: 470, y: 520, w: 140, h: 140 },
    { file: 'loaded_fries_fanta.jpg', name: 'Loaded Fries & Fanta', x: 620, y: 520, w: 140, h: 140 },
    
    // Row 5: Extras
    { file: 'sauces.jpg', name: 'Sauces & Condiments', x: 20, y: 680, w: 140, h: 140 },
    { file: 'cheese_mayo.jpg', name: 'Cheese & Mayo', x: 170, y: 680, w: 140, h: 140 },
    { file: 'fanta_drink.jpg', name: 'Fanta Drink', x: 320, y: 680, w: 140, h: 140 },
    { file: 'fries_strips.jpg', name: 'Fries Strips', x: 470, y: 680, w: 140, h: 140 },
    { file: 'fries_container.jpg', name: 'Fries Container', x: 620, y: 680, w: 140, h: 140 },
  ];
  
  console.log('\n' + '='.repeat(70));
  console.log('🔥 MAD BURNING - MENU ITEM CROPPER 🔥');
  console.log('='.repeat(70) + '\n');
  
  console.log(`📷 Processing: ${MENU_IMAGE}`);
  console.log(`📁 Output to: ${OUTPUT_DIR}\n`);
  
  // Get image metadata
  const metadata = await sharp(MENU_IMAGE).metadata();
  console.log(`✅ Image dimensions: ${metadata.width}x${metadata.height}px\n`);
  console.log(`🔄 Cropping ${CROP_ITEMS.length} items...\n`);
  console.log('='.repeat(70));
  
  let successCount = 0;
  let errors = [];
  
  // Crop each item
  for (const item of CROP_ITEMS) {
    try {
      const outputPath = path.join(OUTPUT_DIR, item.file);
      
      await sharp(MENU_IMAGE)
        .extract({
          left: item.x,
          top: item.y,
          width: item.w,
          height: item.h
        })
        .toFile(outputPath);
      
      successCount++;
      console.log(`✅ ${successCount.toString().padStart(2)}. ${item.name.padEnd(40)} → ${item.file}`);
    } catch (err) {
      errors.push({ item: item.name, error: err.message });
      console.log(`❌ ${item.name.padEnd(40)} → ERROR: ${err.message}`);
    }
  }
  
  console.log('='.repeat(70) + '\n');
  console.log(`🎉 Successfully cropped: ${successCount}/${CROP_ITEMS.length} images`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors: ${errors.length}`);
    errors.forEach(e => {
      console.log(`   - ${e.item}: ${e.error}`);
    });
  }
  
  console.log(`\n📁 All images saved to: ${OUTPUT_DIR}\n`);
  
  if (successCount > 0) {
    console.log('✨ Next steps:');
    console.log('1. Refresh your website');
    console.log('2. All menu images will display automatically\n');
  }
}

// Main execution
async function main() {
  try {
    checkDependencies();
    await cropMenuItems();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
