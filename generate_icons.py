import os
from PIL import Image

def generate_icons():
    favicon_path = os.path.abspath("public/favicon.png")
    output_dir = os.path.abspath("public/icons")
    
    if not os.path.exists(favicon_path):
        print(f"Error: Favicon not found at {favicon_path}")
        return

    os.makedirs(output_dir, exist_ok=True)
    
    # Load source image
    img = Image.open(favicon_path)
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        # 1. Standard icon (any purpose)
        std_img = img.resize((size, size), Image.Resampling.LANCZOS)
        std_img.save(os.path.join(output_dir, f"icon-{size}x{size}.png"), "PNG")
        print(f"Generated standard icon: icon-{size}x{size}.png")
        
        # 2. Maskable icon (needs safe zone, we place resized icon in center of a padded background)
        # Safe zone is roughly 70% of the canvas size
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
