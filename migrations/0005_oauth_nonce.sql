-- Akademia Serwisu PRO 3.9.2: OIDC nonce validation for Google and Microsoft.
-- Additive migration: preserves existing OAuth state rows and all user data.
ALTER TABLE academy_oauth_states ADD COLUMN nonce TEXT NOT NULL DEFAULT '';
