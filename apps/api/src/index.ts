import { createApp } from "./app";
import { env } from "./env";

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`Nestfab API listening on http://localhost:${env.PORT}`);
});
