
CREATE OR REPLACE FUNCTION is_claims_admin() RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'claims_admin' = 'true';
END;
$$;

CREATE OR REPLACE FUNCTION set_claim(uid UUID, claim TEXT, value JSONB) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_claims_admin() THEN
      RETURN 'error: access denied';
  ELSE        
    UPDATE auth.users SET raw_app_meta_data = 
      raw_app_meta_data || 
        json_build_object(claim, value)::jsonb WHERE id = uid;
    RETURN 'OK';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_claims(uid UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE retval JSONB;
BEGIN
  IF NOT is_claims_admin() THEN
      RETURN '{"error":"access denied"}'::jsonb;
  ELSE
    SELECT raw_app_meta_data FROM auth.users INTO retval WHERE id = uid::uuid;
    RETURN retval;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION delete_claim(uid UUID, claim TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_claims_admin() THEN
      RETURN 'error: access denied';
  ELSE        
    UPDATE auth.users SET raw_app_meta_data = 
      raw_app_meta_data - claim WHERE id = uid;
    RETURN 'OK';
  END IF;
END;
$$;


DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;
