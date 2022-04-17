import { CountsByDate } from "../shared/types";
import { Application } from "express";
import { Context } from "./context";

export default (app: Application, context: Context): void => {
  app.get("/api/counts_by_date", (req, res) => {
    context.lsState.then((state) => {
      if (state.tag !== "ready") {
        res.status(503);
        res.json({ error: `ls cache not ready (${state.tag})` });
        return;
      }

      const dates = new Map<string, number>();
      for (const entry of state.entries.values()) {
        if (entry[".tag"] !== "file") continue;
        if (!entry.path_lower?.endsWith(".jpg")) continue;

        const date = entry.client_modified.substring(0, 10);
        dates.set(date, (dates.get(date) || 0) + 1);
      }

      const countsByDate: CountsByDate = [...dates.keys()]
        .sort()
        .map((date) => ({ date, count: dates.get(date) || 0 }));

      const maxAge = 300;
      const expires = new Date(new Date().getTime() + maxAge * 1000);
      res.setHeader("Expires", expires.toUTCString());
      res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

      res.json({ counts_by_date: countsByDate });
    });
  });
};
