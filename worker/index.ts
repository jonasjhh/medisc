import { Hono } from "hono";
import type { AppEnv } from "./types";
import { deviceIdentityMiddleware } from "./middleware/deviceIdentity";
import { coursesRoute } from "./routes/courses";
import { holeScoresRoute } from "./routes/holeScores";
import { playersRoute } from "./routes/players";
import { roundsRoute } from "./routes/rounds";
import { usersRoute } from "./routes/users";

const app = new Hono<AppEnv>();

app.use("/api/*", deviceIdentityMiddleware);

app.route("/api/courses", coursesRoute);
app.route("/api/players", playersRoute);
app.route("/api/rounds", roundsRoute);
app.route("/api/hole-scores", holeScoresRoute);
app.route("/api/users", usersRoute);

app.notFound((c) => {
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
