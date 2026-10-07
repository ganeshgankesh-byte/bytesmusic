# Architecture
- Keep imported BytesMusic domain pages, auth, player, search, and admin behavior under `src/features/bytes`; this preserves the uploaded application's workflows while allowing its presentation to change.
- Use TanStack Start file routes in `src/routes` and a small compatibility adapter for legacy page links; this keeps navigation integrated with the template router without introducing a second router.
- Keep the uploaded project's public Supabase URL and anon key as fallbacks in its client module; this preserves its existing connection when preview environment variables are absent.
- Keep visual tokens and shared UI treatments in `src/styles.css`; this keeps the monochrome design consistent across imported screens.
