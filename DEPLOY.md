# 🚀 Deploy SIAKAD Terpadu ke Google Cloud Run

Aplikasi dikemas sebagai **satu container** (`Dockerfile` di root): API Express sekaligus
menyajikan SPA React, listen di `$PORT` (8080). Database: **Cloud SQL for PostgreSQL**.

Saat container start, `docker-entrypoint.sh` otomatis menjalankan `prisma migrate deploy`
(menerapkan skema), lalu menjalankan server. Seed data demo bersifat opsional via env `RUN_SEED=true`.

## Prasyarat

- Punya project GCP + billing aktif.
- `gcloud` CLI terpasang & login (`gcloud auth login`), atau gunakan **Cloud Shell**.
- Sudah `git clone` repo ini (deploy pakai `--source .`, tidak perlu build image manual).

## 0. Variabel & aktivasi API

```bash
export PROJECT_ID="ganti-project-anda"
export REGION="asia-southeast2"          # Jakarta
export SERVICE="siakad"
export DB_INSTANCE="siakad-db"
export DB_NAME="siakad"
export DB_USER="siakad_user"
export DB_PASS="$(openssl rand -base64 20)"   # simpan baik-baik!

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

## 1. Buat Cloud SQL PostgreSQL

```bash
gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$REGION"

gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"
gcloud sql users create "$DB_USER" --instance="$DB_INSTANCE" --password="$DB_PASS"

# Connection name berformat PROJECT:REGION:INSTANCE
export CONN=$(gcloud sql instances describe "$DB_INSTANCE" --format='value(connectionName)')
echo "CONN=$CONN"
```

## 2. Simpan secret (DATABASE_URL & JWT_SECRET)

Cloud Run terhubung ke Cloud SQL lewat **unix socket** `/cloudsql/CONN`.

```bash
# Perhatikan: host=/cloudsql/... (di-URL-encode: garis miring '/' menjadi %2F)
CONN_ENC=$(printf '%s' "$CONN" | sed 's|/|%2F|g')
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${CONN}&schema=public"

printf '%s' "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create JWT_SECRET --data-file=-
```

> Jika secret sudah ada, ganti `create` → `versions add`.

Beri akun service Cloud Run akses baca secret (biasanya otomatis, kalau perlu):

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for S in DATABASE_URL JWT_SECRET; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
done
```

## 3. Deploy pertama (dengan seed data demo)

`--source .` memicu Cloud Build memakai `Dockerfile` di root secara otomatis.

```bash
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CONN" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest" \
  --set-env-vars "RUN_SEED=true" \
  --cpu 1 --memory 512Mi --min-instances 0 --max-instances 3
```

Setelah selesai, buka URL yang ditampilkan. Login demo (password `password123`):
`admin@kampus.ac.id`, `andi@student.ac.id`, dll (lihat `README.md`).

## 4. Deploy berikutnya (matikan seed)

Seed hanya perlu sekali. Untuk deploy selanjutnya, hilangkan `RUN_SEED` agar
data tidak ditimpa:

```bash
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --add-cloudsql-instances "$CONN" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest" \
  --update-env-vars "RUN_SEED=false" \
  --allow-unauthenticated
```

## Catatan

- **Migrasi** dijalankan otomatis (`prisma migrate deploy`) setiap container start — idempoten.
  Menambah tabel/kolom nanti: buat migrasi baru (`npx prisma migrate dev` di lokal), commit,
  lalu deploy ulang.
- **Port**: aplikasi memakai `$PORT` dari Cloud Run (8080) — tidak perlu diset manual.
- **Biaya**: `db-f1-micro` + `min-instances 0` menekan biaya; Cloud SQL tetap berjalan (ada
  biaya idle). Untuk mematikan sementara: `gcloud sql instances patch "$DB_INSTANCE" --activation-policy=NEVER`.
- **Uji image secara lokal** (opsional, butuh Docker):
  ```bash
  docker build -t siakad .
  docker run -p 8080:8080 -e DATABASE_URL="postgresql://…" -e JWT_SECRET="dev" -e RUN_SEED=true siakad
  ```
