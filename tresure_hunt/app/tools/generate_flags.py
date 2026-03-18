import hashlib

FLAGS = {
    1: "BOOT{p1_y0u_s33_m3}",
    2: "BOOT{p2_d3c0d3d}",
    3: "BOOT{p3_h34d3rs_sp34k}",
    4: "BOOT{p4_ciphers_crs}",
    5: "BOOT{p5_f1r3w4ll_br34ch3d}",
}

for level, flag in FLAGS.items():
    h = hashlib.sha256(flag.encode("utf-8")).hexdigest()
    print(f"FLAG_HASH_L{level}={h}")
