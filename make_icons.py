#!/usr/bin/env python3
import struct, zlib, os

def png_chunk(tag, data):
    c = tag + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c))

def make_icon(size, path):
    pixels = []
    px = size // 48 if size >= 96 else 1
    bg = (22, 24, 28, 255)
    fg = (232, 232, 232, 255)
    accent = (111, 168, 220, 255)
    drop_col = accent if size >= 96 else fg
    for y in range(size):
        row = []
        for x in range(size):
            c = bg
            # cloud: two overlapping circles + rectangle
            cx1, cy1, r1 = size*0.38, size*0.42, size*0.16
            cx2, cy2, r2 = size*0.62, size*0.44, size*0.14
            cy3 = size*0.48
            in1 = (x-cx1)**2 + (y-cy1)**2 <= r1*r1
            in2 = (x-cx2)**2 + (y-cy2)**2 <= r2*r2
            in3 = size*0.24 <= x <= size*0.76 and size*0.34 <= y <= cy3
            if in1 or in2 or in3:
                c = fg
            # drops
            for dx, dy in [(0.42, 0.68), (0.58, 0.74), (0.34, 0.80), (0.66, 0.84), (0.50, 0.86)]:
                dxs, dys = size*dx, size*dy
                if (x-dxs)**2 + (y-dys)**2 <= (size*0.018)**2 and (x % (px*3) < px or True):
                    if abs(((x/size - dx)*100) % 1) < 0.5:
                        c = drop_col
            row.append(c)
        pixels.append(row)
    raw = b"".join(b"\x00" + b"".join(struct.pack("BBBB", *p) for p in row) for row in pixels)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", zlib.compress(raw, 9)) + png_chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)

os.makedirs("/workspace/rain/icons", exist_ok=True)
make_icon(192, "/workspace/rain/icons/icon-192.png")
make_icon(512, "/workspace/rain/icons/icon-512.png")
print("done")
