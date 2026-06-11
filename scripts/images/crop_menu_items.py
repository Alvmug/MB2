import cv2
import os
from PIL import Image

# ── PATH CONFIGURATION ──
# Use relative paths from script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_IMAGE = os.path.join(SCRIPT_DIR, '..', '..', 'public', 'assets', 'menu_full.jpg')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'public', 'assets')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── MENU ITEMS & THEIR CROP COORDINATES (x, y, width, height) ──
# These coordinates are approximate and should be adjusted based on your actual image
CROP_ITEMS = {
    # CHICKEN MENU
    'chicken_burger.jpg': (375, 100, 170, 170),  # Chicken Burger
    'chicken_burger_chips.jpg': (560, 250, 170, 170),  # Chicken Burger & Chips
    'double_chicken_chips.jpg': (375, 250, 170, 170),  # Double Chicken Burger & Chips
    'chicken_fries_fanta.jpg': (375, 250, 170, 170),  # Chicken Fries & Fanta
    'omelette_burger_chips.jpg': (560, 100, 170, 170),  # Omelette Burger & Chips
    
    # BOX CHICKEN COMBOS
    'chicken_combo_1.jpg': (375, 250, 170, 170),  # Chicken Burger & Chips & Fanta
    'chicken_combo_2.jpg': (560, 250, 170, 170),  # Double Chicken Burger & Chips & Fanta
    'chicken_fries_combo.jpg': (375, 250, 170, 170),  # Chicken Fries & Fanta
    
    # BEEF MENU
    'beef_burger.jpg': (375, 350, 170, 170),  # Beef Burger
    'beef_burger_chips.jpg': (560, 350, 170, 170),  # Beef Burger & Chips
    'double_beef_chips.jpg': (375, 500, 170, 170),  # Double Beef Burger & Chips
    'beef_fries.jpg': (560, 350, 170, 170),  # Beef Fries
    
    # BOX BEEF COMBOS
    'beef_combo_1.jpg': (375, 450, 170, 170),  # Beef Burger & Chips & Fanta
    'beef_combo_2.jpg': (560, 450, 170, 170),  # Double Beef Burger & Chips & Fanta
    'beef_fries_combo.jpg': (375, 550, 170, 170),  # Beef Fries & Fanta
    
    # EXTRAS
    'sauces_cheese.jpg': (375, 600, 170, 170),  # Sauces & Cheese
    'fanta.jpg': (560, 600, 170, 170),  # Fanta
    'chips.jpg': (375, 650, 170, 170),  # Chips
}

def crop_menu_items():
    """Crop all menu items from the menu image"""
    
    if not os.path.exists(MENU_IMAGE):
        print(f"❌ Menu image not found at: {MENU_IMAGE}")
        print("📝 Please save your menu image as 'menu_full.jpg' in the assets folder")
        return
    
    # Load the menu image
    img = cv2.imread(MENU_IMAGE)
    if img is None:
        print(f"❌ Could not read image: {MENU_IMAGE}")
        return
    
    height, width = img.shape[:2]
    print(f"📷 Image size: {width}x{height}")
    print(f"🔄 Starting to crop {len(CROP_ITEMS)} menu items...")
    print()
    
    success_count = 0
    
    for filename, (x, y, w, h) in CROP_ITEMS.items():
        # Crop the region
        cropped = img[y:y+h, x:x+w]
        
        # Save the cropped image
        output_path = os.path.join(OUTPUT_DIR, filename)
        cv2.imwrite(output_path, cropped)
        
        success_count += 1
        print(f"✅ {success_count}. {filename}")
    
    print()
    print(f"🎉 Successfully cropped {success_count} images!")
    print(f"📁 Saved to: {OUTPUT_DIR}")

def calibrate_crops():
    """Interactive tool to find exact coordinates"""
    
    if not os.path.exists(MENU_IMAGE):
        print(f"❌ Menu image not found at: {MENU_IMAGE}")
        return
    
    img = cv2.imread(MENU_IMAGE)
    if img is None:
        print(f"❌ Could not read image: {MENU_IMAGE}")
        return
    
    print("🎯 CROP CALIBRATION MODE")
    print("=" * 50)
    print("Click and drag to select a region, then press 'c' to copy coordinates")
    print("Press 'q' to quit calibration")
    print()
    
    # Display image with mouse callback
    cv2.imshow('Menu Items - Select regions', img)
    cv2.setMouseCallback('Menu Items - Select regions', mouse_callback)
    
    while True:
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
    
    cv2.destroyAllWindows()

def mouse_callback(event, x, y, flags, param):
    """Mouse callback for interactive calibration"""
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Start: ({x}, {y})")
    elif event == cv2.EVENT_RBUTTONDOWN:
        print(f"End: ({x}, {y})")

if __name__ == '__main__':
    print("=" * 60)
    print("🔥 MAD BURNING - MENU ITEM CROPPER 🔥")
    print("=" * 60)
    print()
    
    # Run the cropper
    crop_menu_items()
    
    print()
    print("📌 MANUAL ADJUSTMENT NEEDED:")
    print("The coordinates above are approximate.")
    print("You may need to adjust them in the CROP_ITEMS dictionary")
    print("based on your actual image dimensions.")
    print()
    print("💡 TIP: Use the calibrate_crops() function to find exact coordinates")
