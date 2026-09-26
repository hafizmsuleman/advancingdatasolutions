CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.job_secrets (name text PRIMARY KEY, value text NOT NULL);
REVOKE ALL ON private.job_secrets FROM PUBLIC, anon, authenticated;