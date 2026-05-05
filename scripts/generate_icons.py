from PIL import Image
import os

src_path = os.path.join(os.path.dirname(__file__), "..", "public", "logo", "lo9o.png")
out_dir = os.path.join(os.path.dirname(__file__), "..", "public")

src = Image.open(src_path).convert("RGBA")

for size in [16, 48, 128]:
    out_path = os.path.join(out_dir, f"icon-{size}.png")
    src.resize((size, size), Image.LANCZOS).save(out_path, "PNG")
    print(f"✓ icon-{size}.png ({size}x{size})")

print("Done.")
