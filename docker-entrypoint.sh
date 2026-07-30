#!/bin/sh
# Entrypoint container Cloud Run.
# 1) Terapkan skema database (migrasi), 2) seed opsional, 3) jalankan server.
set -e

echo "▶ Menerapkan migrasi database (prisma migrate deploy)…"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 RUN_SEED=true → menjalankan seed data demo…"
  npx tsx prisma/seed.ts || echo "⚠ Seed gagal / sudah ada data, dilewati."
fi

echo "🚀 Menjalankan SIAKAD Terpadu di port ${PORT}…"
exec node dist/index.js
