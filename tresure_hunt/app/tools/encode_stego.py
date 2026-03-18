from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parents[1]
OUT_PATH = BASE_DIR / "static" / "assets" / "stego_image.png"

MESSAGE = "LOCK1:firewall"


def encode():
    # Create a simple image
    width, height = 200, 200
    img = Image.new("RGB", (width, height), color=(20, 30, 45))
    pixels = img.load()

    msg_bytes = MESSAGE.encode("ascii") + b"\x00"

    idx = 0
    for y in range(height):
        for x in range(width):
            if idx >= len(msg_bytes):
                break
            pixel_index = y * width + x
            r, g, b = pixels[x, y]
            if pixel_index % 7 == 0:
                r = msg_bytes[idx] ^ 42
                idx += 1
            pixels[x, y] = (r, g, b)
        if idx >= len(msg_bytes):
            break

    img.save(OUT_PATH)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    encode()
