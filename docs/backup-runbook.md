# Backup Runbook

- **Backup strategy:** Nightly GitHub Action with pg_dump → stored as artifact (30 days).
- **Secrets used:** SUPABASE_DB_URL.
- **Restore:**
  1. Download latest artifact from GitHub Actions → supabase-backup.
  2. Create a new Supabase project.
  3. Run `psql "$NEW_DB_URL" < backup.sql`.
  4. Verify tables and row counts.
- **Notes:**
  - Run manual backup before risky migrations.
  - Keep important dumps offsite (Google Drive).
