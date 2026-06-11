# 🔥 MAD BURNING - MENU ITEM AUTO-CROPPER

## Quick Start

### Step 1: Save Your Menu Image
- Take the menu image you provided
- Save it as `menu_full.jpg` in the `public/assets/` folder
- Path: `public/assets/menu_full.jpg` (relative to the project root directory)

### Step 2: Run the Script
Open PowerShell/terminal in the project root folder and run:

```powershell
python scripts/images/crop_menu_smart.py
```

### Step 3: Check Results
All cropped images will be saved automatically to the `public/assets/` folder with names like:
- `chicken_burger.jpg`
- `chicken_burger_chips.jpg`
- `beef_burger_fanta.jpg`
- etc.

---

## What This Script Does

✅ **Automatically detects** red product boxes in your menu image
✅ **Crops each product** individually
✅ **Saves with proper naming** matching your menu structure
✅ **Only crops items** that are in your Mad Burning menu

---

## Menu Items It Will Crop

### CHICKEN MENU (5 items)
1. Chicken Burger
2. Chicken Burger & Chips
3. Double Chicken Burger & Chips
4. Chicken Fries
5. Omelette Burger & Chips

### BOX (CHICKEN COMBOS) (3 items)
1. Chicken Burger & Chips & Fanta
2. Double Chicken Burger & Chips & Fanta
3. Chicken Fries & Fanta

### BEEF MENU (4 items)
1. Beef Burger
2. Beef Burger & Chips
3. Double Beef Burger & Chips
4. Beef Fries

### BOX (BEEF COMBOS) (3 items)
1. Beef Burger & Chips & Fanta
2. Double Beef Burger & Chips & Fanta
3. Beef Fries & Fanta

### EXTRAS (3 items)
1. Sauces & Cheese
2. Fanta
3. Chips

---

## If Smart Crop Doesn't Work

If the script can't find the red boxes automatically, use manual mode:

```powershell
python scripts/images/crop_menu_smart.py
# Then when prompted, run the interactive tool
```

---

## After Cropping

Once all images are cropped and saved:
1. The menu will automatically use them
2. Refresh your website to see the changes
3. All product images will match perfectly!

---

## Troubleshooting

**"Image not found"?**
- Make sure you saved `menu_full.jpg` in the public/assets/ folder
- Check the path is correct

**"No boxes found"?**
- The script couldn't detect red boxes
- Try manually cropping with the interactive tool
- Or adjust the color range in the script (HSV values)

**Python not installed?**
- Download Python from python.org
- Make sure to check "Add Python to PATH"

---

**Made with 🔥 by Copilot**
