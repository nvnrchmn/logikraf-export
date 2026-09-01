# logikraf-export

Sistem manajemen ekspor internal **logikraf.id** — mousepad & sejenisnya (KBLI 46511).

**Alur:** supplier kirim barang jadi → gudang → order buyer → packing → dokumen otomatis (PI, CI, PL, SI, PEB Data Sheet) → tracking manual.

**Stack:** Go Fiber v3 + React 19 (Vite + Tailwind) + MySQL · deploy via GitHub Actions + rsync + systemd · `export.logikraf.id`

**Dokumen:** buka `.hermesrules` untuk status & arsitektur terbaru, dan `~/.hermes/plans/2026-09-01_210450-logikraf-export-sprint1.md` untuk rencana Sprint 1.
