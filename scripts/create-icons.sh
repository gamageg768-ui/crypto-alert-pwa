#!/bin/bash
# Creates minimal valid placeholder PNG icons using Python
python3 - << 'PYEOF'
import struct, zlib, os

def create_png(size, filename):
    """Create a minimal valid blue PNG with lightning bolt emoji-like shape."""
    # Create pixel data - solid blue gradient
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            # Blue gradient background
            r = int(37 + (x/size) * 80)
            g = int(99 + (y/size) * 40)
            b = int(235)
            # Simple lightning bolt shape (white pixels)
            cx, cy = size//2, size//2
            # Draw a simple bolt shape in the center
            in_bolt = False
            nx = (x - cx) / (size * 0.15)
            ny = (y - cy) / (size * 0.3)
            # Top triangle of bolt
            if -0.5 < ny < 0 and abs(nx) < (0.5 + ny):
                in_bolt = True
            # Bottom triangle of bolt
            if 0 < ny < 0.5 and abs(nx) < (0.5 - ny):
                in_bolt = True
            if in_bolt:
                row.extend([255, 255, 255])
            else:
                row.extend([r, g, b])
        pixels.append(bytes([0] + row))
    
    raw = b''.join(pixels)
    compressed = zlib.compress(raw)
    
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    
    os.makedirs('public/icons', exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f'Created {filename} ({size}x{size})')

create_png(192, 'public/icons/icon-192.png')
create_png(512, 'public/icons/icon-512.png')
print('Icons generated successfully!')
PYEOF
