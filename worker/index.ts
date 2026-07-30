import { Hono } from "hono";
import type { Env } from "./types";
import { coursesRoute } from "./routes/courses";
import { holeScoresRoute } from "./routes/holeScores";
import { layoutsRoute } from "./routes/layouts";
import { playersRoute } from "./routes/players";
import { roundsRoute } from "./routes/rounds";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/courses", coursesRoute);
app.route("/api/layouts", layoutsRoute);
app.route("/api/players", playersRoute);
app.route("/api/rounds", roundsRoute);
app.route("/api/hole-scores", holeScoresRoute);

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
