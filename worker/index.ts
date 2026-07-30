import { Hono } from "hono";
import type { Env } from "./types";
import { coursesRoute } from "./routes/courses";
import { layoutsRoute } from "./routes/layouts";
import { scoresRoute } from "./routes/scores";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/courses", coursesRoute);
app.route("/api/layouts", layoutsRoute);
app.route("/api/scores", scoresRoute);

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
