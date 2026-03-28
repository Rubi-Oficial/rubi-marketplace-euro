

# Fix: Build errors in `track-visit` edge function

## Errors (5 total)

1. **Lines 139-140**: `data.country_code || ""` — TS infers `{}` from the fallback `||` with empty string when the column type is nullable. Fix: cast explicitly.
2. **Line 212**: `getCachedGeo` parameter type mismatch — `ReturnType<typeof createClient>` is too strict with generics. Fix: use `any` for the supabase param type.
3. **Lines 144-145**: Same issue for `enrichGeoAsync`.
4. **Line 246**: `EdgeRuntime` is not defined — Deno edge runtime uses `globalThis` or we should just fire-and-forget with `.catch()` instead.

## Changes — single file: `supabase/functions/track-visit/index.ts`

### Fix 1: Replace `ReturnType<typeof createClient>` with `any` in function signatures
- `getCachedGeo(supabase: any, ...)` (line 129)
- `enrichGeoAsync(supabase: any, ...)` (line 145)

### Fix 2: Fix nullable string coercion (lines 139-140)
```ts
country_code: (data.country_code as string) || "",
city_name: (data.city_name as string) || "",
```

### Fix 3: Replace `EdgeRuntime.waitUntil()` with fire-and-forget (line 246)
```ts
enrichGeoAsync(supabase, { visitIds, ipHash, ip }).catch(console.error);
```

This removes the dependency on `EdgeRuntime` which isn't available in the Deno type checker, while preserving the async geo enrichment behavior.

## Impact
- No behavior change — only type fixes and a runtime-equivalent replacement for `waitUntil`.
- All other edge functions (`create-checkout`, `sitemap`, `stripe-webhook`) should pass once this file is fixed (the errors are all in `track-visit`).

