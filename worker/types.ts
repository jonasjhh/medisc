export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export interface Variables {
  deviceToken: string | null;
  userId: number | null;
}

export type AppEnv = { Bindings: Env; Variables: Variables };
