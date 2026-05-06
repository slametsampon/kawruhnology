#!/usr/bin/env python3
r"""
check-mdx-math.py

Pemakaian:
  python check-mdx-math.py path/to/artikel.mdx

Fungsi:
  - Mengecek pasangan blok $$...$$
  - Mendeteksi baris ==== di dalam formula
  - Mendeteksi # di awal baris formula
  - Mendeteksi persen (%) yang belum di-escape menjadi \%
  - Mendeteksi karakter unicode matematika yang sebaiknya diganti dengan LaTeX
"""

from pathlib import Path
import re
import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python check-mdx-math.py path/to/file.mdx")
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File tidak ditemukan: {path}")
        return 2

    lines = path.read_text(encoding="utf-8").splitlines()
    in_block = False
    block_start = None
    blocks = []
    content = []

    for i, line in enumerate(lines, start=1):
        if line.strip() == "$$":
            if not in_block:
                in_block = True
                block_start = i
                content = []
            else:
                blocks.append((block_start, i, content[:]))
                in_block = False
                block_start = None
        elif in_block:
            content.append((i, line))

    if in_block:
        print(f"[ERROR] Blok $$ dibuka pada baris {block_start}, tetapi tidak ditutup.")
        return 1

    issues = []
    for n, (start, end, body) in enumerate(blocks, start=1):
        for lineno, line in body:
            stripped = line.strip()

            if stripped and set(stripped) <= {"="}:
                issues.append((lineno, n, "Baris berisi '=' berulang. Ganti dengan aligned dan &=."))

            if stripped.startswith("#"):
                issues.append((lineno, n, "Tanda # di dalam formula. Hapus atau ubah menjadi teks biasa di luar blok math."))

            if re.search(r"(?<!\\)%", line):
                issues.append((lineno, n, "Karakter % belum di-escape. Gunakan \\%."))

            if any(ch in line for ch in ["²", "×", "–", "—"]):
                issues.append((lineno, n, "Karakter unicode matematika terdeteksi. Gunakan ^2, \\times, atau tanda minus standar."))

    print(f"Total blok formula $$...$$: {len(blocks)}")

    if not issues:
        print("Tidak ditemukan pola error formula yang umum.")
        return 0

    print(f"Ditemukan {len(issues)} potensi error:")
    for lineno, block_no, msg in issues:
        print(f"- Baris {lineno}, blok formula #{block_no}: {msg}")

    return 1

if __name__ == "__main__":
    raise SystemExit(main())
