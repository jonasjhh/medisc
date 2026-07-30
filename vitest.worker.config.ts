import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      include: ["worker/**/*.test.ts"],
      setupFiles: ["./worker/test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          // Bindings are declared directly (rather than via wrangler.toml)
          // so these tests don't depend on a built `dist/` for the assets
          // binding — they only exercise the API routes, never ASSETS.
          miniflare: {
            d1Databases: ["DB"],
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
