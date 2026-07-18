
ALTER FUNCTION public.apply_stock_movement() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;
