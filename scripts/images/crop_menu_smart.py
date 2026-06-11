import cv2
import numpy as np
import os
from PIL import Image

# ── PATH CONFIGURATION ──
# Use relative paths from script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MENU_IMAGE = os.path.join(SCRIPT_DIR, '..', '..', 'public', 'assets', 'menu_full.jpg')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'public', 'assets')

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── MENU ITEMS IN ORDER (to match crops) ──
MENU_ITEMS = [
    # CHICKEN MENU
    ('chicken_burger.jpg', 'Chicken Burger'),
    ('chicken_burger_chips.jpg', 'Chicken Burger & Chips'),
    ('double_chicken_chips.jpg', 'Double Chicken Burger & Chips'),
    ('chicken_fries.jpg', 'Chicken Fries'),
    ('omelette_burger_chips.jpg', 'Omelette Burger & Chips'),
    
    # BOX CHICKEN
    ('chicken_burger_chips_fanta.jpg', 'Chicken Burger & Chips & Fanta'),
    ('double_chicken_chips_fanta.jpg', 'Double Chicken Burger & Chips & Fanta'),
    ('chicken_fries_fanta.jpg', 'Chicken Fries & Fanta'),
    
    # BEEF MENU
    ('beef_burger.jpg', 'Beef Burger'),
    ('beef_burger_chips.jpg', 'Beef Burger & Chips'),
    ('double_beef_chips.jpg', 'Double Beef Burger & Chips'),
    ('beef_fries.jpg', 'Beef Fries'),
    
    # BOX BEEF
    ('beef_burger_chips_fanta.jpg', 'Beef Burger & Chips & Fanta'),
    ('double_beef_chips_fanta.jpg', 'Double Beef Burger & Chips & Fanta'),
    ('beef_fries_fanta.jpg', 'Beef Fries & Fanta'),
    
    # EXTRAS
    ('sauces_cheese.jpg', 'Sauces & Cheese'),
    ('fanta.jpg', 'Fanta'),
    ('chips.jpg', 'Chips'),
]

def smart_crop_menu():
    """Intelligently crop menu items from image"""
    
    if not os.path.exists(MENU_IMAGE):
        print(f"❌ Image not found: {MENU_IMAGE}")
        print("\n📝 STEPS TO USE THIS SCRIPT:")
        print("1. Save your menu image as 'menu_full.jpg' in assets folder")
        print("2. Run this script again")
        return False
    
    img = cv2.imread(MENU_IMAGE)
    if img is None:
        print(f"❌ Could not read image")
        return False
    
    height, width = img.shape[:2]
    print(f"📷 Image dimensions: {width}x{height} pixels")
    
    # Convert to RGB for PIL
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb_img)
    
    print(f"\n🔄 Processing {len(MENU_ITEMS)} menu items...")
    print("=" * 60)
    
    # Find red boxes (Mad Burning uses red boxes for product items)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Red color range in HSV
    lower_red1 = np.array([0, 100, 100])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 100, 100])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask = cv2.bitwise_or(mask1, mask2)
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours by size and get bounding rectangles
    boxes = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        # Filter by reasonable size (not too small, not too large)
        if 100 < w < 300 and 100 < h < 300:
            boxes.append((x, y, w, h))
    
    # Sort boxes by position (top to bottom, left to right)
    boxes.sort(key=lambda b: (b[1], b[0]))
    
    print(f"✅ Found {len(boxes)} red product boxes")
    print()
    
    # Match boxes to menu items
    cropped_count = 0
    
    for idx, (filename, item_name) in enumerate(MENU_ITEMS):
        if idx < len(boxes):
            x, y, w, h = boxes[idx]
            
            # Add padding
            pad = 10
            x = max(0, x - pad)
            y = max(0, y - pad)
            w = min(width - x, w + 2*pad)
            h = min(height - y, h + 2*pad)
            
            # Crop
            cropped = img[y:y+h, x:x+w]
            
            # Save
            output_path = os.path.join(OUTPUT_DIR, filename)
            cv2.imwrite(output_path, cropped)
            
            cropped_count += 1
            print(f"✅ {cropped_count:2d}. {item_name:<45} → {filename}")
        else:
            print(f"⚠️  {idx+1:2d}. {item_name:<45} → SKIPPED (no more boxes found)")
    
    print("=" * 60)
    print(f"\n🎉 Successfully saved {cropped_count} product images!")
    print(f"📁 Location: {OUTPUT_DIR}\n")
    
    return True

def manual_crop_interactive():
    """Interactive manual cropping tool"""
    
    if not os.path.exists(MENU_IMAGE):
        print(f"❌ Menu image not found")
        return
    
    img = cv2.imread(MENU_IMAGE)
    clone = img.copy()
    start_x, start_y, end_x, end_y = 0, 0, 0, 0
    cropping = False
    
    def mouse_event(event, x, y, flags, param):
        nonlocal start_x, start_y, end_x, end_y, cropping, clone
        
        if event == cv2.EVENT_LBUTTONDOWN:
            start_x, start_y = x, y
            cropping = True
        elif event == cv2.EVENT_MOUSEMOVE and cropping:
            end_x, end_y = x, y
            clone = img.copy()
            cv2.rectangle(clone, (start_x, start_y), (end_x, end_y), (0, 255, 0), 2)
            cv2.imshow('Select Region - Drag to select, press C to confirm', clone)
        elif event == cv2.EVENT_LBUTTONUP:
            cropping = False
    
    cv2.namedWindow('Select Region - Drag to select, press C to confirm')
    cv2.setMouseCallback('Select Region - Drag to select, press C to confirm', mouse_event)
    cv2.imshow('Select Region - Drag to select, press C to confirm', img)
    
    print("🎯 INTERACTIVE CROP MODE")
    print("Drag to select a region, then press 'C' to save crop")
    print("Press 'Q' to exit\n")
    
    crop_num = 1
    
    while True:
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('c') and start_x < end_x and start_y < end_y:
            cropped = img[start_y:end_y, start_x:end_x]
            filename = f'product_{crop_num:02d}.jpg'
            path = os.path.join(OUTPUT_DIR, filename)
            cv2.imwrite(path, cropped)
            print(f"✅ Saved: {filename}")
            crop_num += 1
            clone = img.copy()
            cv2.imshow('Select Region - Drag to select, press C to confirm', clone)
    
    cv2.destroyAllWindows()

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🔥 MAD BURNING - AUTO MENU CROPPER 🔥")
    print("=" * 60 + "\n")
    
    # Try smart crop first
    success = smart_crop_menu()
    
    if not success:
        print("\n⚠️  Smart crop failed. Make sure you have:")
        print("1. Saved the menu image as 'menu_full.jpg' in assets/")
        print("2. The image contains red product boxes")
