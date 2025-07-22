import type { PhotoDbEntry } from "dropbox-hacking-photo-manager-shared";
import { Application } from "express";

import { Context } from "../context.js";

export default (app: Application, context: Context): void => {
  app.post("/api/multi-photo-tags", (req, res) => {
    const body = req.body as unknown as {
      contentHashes: string[];
      tagActions: { tag: string; action: "add" | "remove" }[];
    };

    void context
      .photoRxTransformer(async (oldDb) => {
        const newDb = { ...oldDb };

        for (const contentHash of body.contentHashes) {
          const entry = newDb[contentHash] ?? {
            description: "",
            tags: [],
          };

          const newTags = new Set(entry.tags ?? []);

          for (const tagAction of body.tagActions) {
            if (tagAction.action === "add") newTags.add(tagAction.tag);
            else if (tagAction.action === "remove")
              newTags.delete(tagAction.tag);
          }

          const newEntry: PhotoDbEntry = {
            ...entry,
            tags: [...newTags].sort(),
          };

          newDb[contentHash] = newEntry;
        }

        return newDb;
      })
      .then(() => res.status(204))
      .catch((error) => {
        console.error(`Error in ${req.method} ${req.path}:`, error);
        res.sendStatus(500);
      })
      .finally(() => res.end());
  });
};
