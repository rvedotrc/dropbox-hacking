import * as express from "express";
import * as path from "path";

const app = express();

app.use(
  express.static(path.join(__dirname, "../../../photo-manager-client/public"))
);

app.get("/api/foo", (req, res) => {
  res.setHeader("Cache-Control", "private; max-age=10");
  res.json({ hello: "there", query: req.query });
});

app.listen(4000, () => {
  console.log("listening on port 4000");
});
