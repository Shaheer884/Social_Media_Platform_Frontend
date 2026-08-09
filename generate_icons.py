import os
import shutil
from PIL import Image, ImageDraw

def generate_icons():
    favicon_path = os.path.abspath("public/favicon.png")
    original_favicon_path = os.path.abspath("public/favicon_original.png")
    output_dir = os.path.abspath("public/icons")
    
    # 1. Handle original backup to preserve source square icon
    if not os.path.exists(original_favicon_path):
        if os.path.exists(favicon_path):
            shutil.copy2(favicon_path, original_favicon_path)
            print(f"Created backup of original square favicon at: {original_favicon_path}")
        else:
            print(f"Error: Favicon not found at {favicon_path}")
            return
            
    # Always load from the original square backup source
    img = Image.open(original_favicon_path)
    os.makedirs(output_dir, exist_ok=True)
    
    # 2. Re-generate public/favicon.png itself with rounded corners (25% of size)
    orig_w, orig_h = img.size
    rounded_fav = img.resize((orig_w, orig_h), Image.Resampling.LANCZOS).convert("RGBA")
    fav_radius = int(orig_w * 0.25)
    fav_mask = Image.new("L", (orig_w, orig_h), 0)
    fav_draw = ImageDraw.Draw(fav_mask)
    fav_draw.rounded_rectangle((0, 0, orig_w, orig_h), radius=fav_radius, fill=255)
    rounded_fav.putalpha(fav_mask)
    rounded_fav.save(favicon_path, "PNG")
    print(f"Overwrote {favicon_path} with 25% rounded corner version")
    
    # 3. Generate PWA standard sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        # 1. Standard icon (any purpose) - Apply rounded corners (25% of size)
        std_img = img.resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
        
        # Create rounded corner mask
        radius = int(size * 0.25)
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
        
        # Apply mask
        std_img.putalpha(mask)
        std_img.save(os.path.join(output_dir, f"icon-{size}x{size}.png"), "PNG")
        print(f"Generated rounded standard icon: icon-{size}x{size}.png")
        
        # 2. Maskable icon (needs solid safe zone background, we center resized icon on canvas)
        padded_size = int(size * 0.7)
        resized_icon = img.resize((padded_size, padded_size), Image.Resampling.LANCZOS)
        
        # Create solid white canvas
        maskable_img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        
        # Calculate centering coordinates
        offset = (size - padded_size) // 2
        
        # Paste resized icon onto canvas
        maskable_img.paste(resized_icon, (offset, offset), resized_icon if resized_icon.mode == 'RGBA' else None)
        maskable_img.save(os.path.join(output_dir, f"maskable-icon-{size}x{size}.png"), "PNG")
        print(f"Generated maskable icon: maskable-icon-{size}x{size}.png")

if __name__ == "__main__":
    generate_icons()
