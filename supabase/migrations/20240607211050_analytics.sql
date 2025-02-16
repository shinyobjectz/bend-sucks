
CREATE OR REPLACE FUNCTION public.get_tag_metrics()
RETURNS TABLE(month TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS total
  FROM tags
  GROUP BY TO_CHAR(created_at, 'Mon')
  ORDER BY TO_CHAR(created_at, 'Mon');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_label_metrics()
RETURNS TABLE(month TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS total
  FROM labels
  GROUP BY TO_CHAR(created_at, 'Mon')
  ORDER BY TO_CHAR(created_at, 'Mon');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_category_metrics()
RETURNS TABLE(month TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS total
  FROM categories
  GROUP BY TO_CHAR(created_at, 'Mon')
  ORDER BY TO_CHAR(created_at, 'Mon');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_product_metrics()
RETURNS TABLE(month TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS total
  FROM products
  GROUP BY TO_CHAR(created_at, 'Mon')
  ORDER BY TO_CHAR(created_at, 'Mon');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_metrics()
RETURNS TABLE(month TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(created_at, 'Mon') AS month, COUNT(*) AS total
  FROM users
  GROUP BY TO_CHAR(created_at, 'Mon')
  ORDER BY TO_CHAR(created_at, 'Mon');
END;
$$ LANGUAGE plpgsql;
