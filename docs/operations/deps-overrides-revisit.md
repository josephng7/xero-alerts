# Revisit `pnpm.overrides` (security transitives)

We prefer **no** `package.json` overrides. These exist only while upstream pins still pull vulnerable versions:

| Override | Reason | Upstream to watch |
|----------|--------|-------------------|
| `postcss` → **8.5.14** | Next.js still depends on PostCSS **8.4.x**; advisory needs **≥ 8.5.10** ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)) | [next](https://www.npmjs.com/package/next?activeTab=versions) changelog / lockfile bump to PostCSS ≥ 8.5.10 |
| `@esbuild-kit/core-utils>esbuild` → **0.25.12** | `drizzle-kit` keeps **`@esbuild-kit/esm-loader`**, which resolves **esbuild ≤ 0.24.2** ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) | [drizzle-kit](https://www.npmjs.com/package/drizzle-kit?activeTab=versions) removes or upgrades the `@esbuild-kit` chain |

## How to re-check (quarterly or after major bumps)

1. Delete the `pnpm.overrides` block in `package.json`.
2. Run `pnpm install` then `pnpm audit`.
3. If **clean**, run `pnpm run verify`, commit the removal, and delete or shorten this doc.
4. If **not clean**, restore the overrides from git history and note the versions still blocked in `docs/operations/logbook.md`.

Optional: after `pnpm install` without overrides, `pnpm why postcss` and `pnpm why esbuild` show which packages still constrain versions.
