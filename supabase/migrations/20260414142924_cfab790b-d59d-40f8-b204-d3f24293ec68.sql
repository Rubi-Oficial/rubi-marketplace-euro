REVOKE EXECUTE ON FUNCTION public.activate_or_renew_highlight(uuid, text, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_boost(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alloc_top_key(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alloc_bottom_key(text) FROM anon, authenticated;