import { files } from "dropbox";
import { Application } from "express";

import { Context } from "../context.js";
import File = files.FileMetadataReference;
import Folder = files.FolderMetadataReference;

type Item = File | Folder;
// type RequireFields<T extends object, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type FolderStats = {
  name: string;
  path_lower: string;

  sizeDirectFiles: number;
  countDirectFiles: number;
  countDirectFolders: number;
  directFolderStats: Record<string, FolderStats>;

  sizeAllFiles: number;
  countAllFiles: number;
  countAllFolders: number;
};

export default (app: Application, context: Context): void => {
  app.get("/api/ls/du", (_req, res) => {
    context.lsFeed
      .read()
      .then((state) => {
        if (state.tag !== "ready") {
          res.status(503);
          res.json({ error: `ls cache not ready (${state.tag})` });
          return;
        }

        const items: Item[] = [...state.entries.values()];

        const itemsWithPaths = items.flatMap((item) =>
          item.path_display === undefined || item.path_lower === undefined
            ? []
            : [
                {
                  ...item,
                  path_display: item.path_display,
                  path_lower: item.path_lower,
                },
              ],
        );

        const withDirnameBasename = itemsWithPaths.map((item) => ({
          ...item,
          parent_path_lower: item.path_lower.substring(
            0,
            item.path_lower.lastIndexOf("/"),
          ),
          name_lower: item.name.toLowerCase(),
        }));

        withDirnameBasename.push({
          ".tag": "folder",
          name: "",
          name_lower: "",
          path_lower: "",
          path_display: "",
          parent_path_lower: "",
          id: "",
        });

        const folders = new Map<
          string,
          {
            folderItem: (typeof withDirnameBasename)[number];
            childItems: typeof withDirnameBasename;
          }
        >();

        for (const item of withDirnameBasename) {
          if (item[".tag"] === "folder") {
            folders.set(item.path_lower, {
              folderItem: item,
              childItems: [],
            });
          }
        }

        for (const item of withDirnameBasename) {
          if (item.path_lower === "") continue;

          const folder = folders.get(item.parent_path_lower);
          if (folder === undefined) throw new Error("eek");

          folder.childItems.push(item);
        }

        const seenKeys = new Set(folders.keys());
        const buildStats = (path_lower: string): FolderStats => {
          seenKeys.delete(path_lower);

          const folder = folders.get(path_lower);
          if (folder === undefined) throw new Error("a");

          let sizeDirectFiles = 0;
          let countDirectFiles = 0;
          let countDirectFolders = 0;

          let sizeAllFiles = 0;
          let countAllFiles = 0;
          let countAllFolders = 0;

          const directFolderStats: Record<string, FolderStats> = {};

          for (const child of folder.childItems) {
            if (child[".tag"] === "file") {
              sizeDirectFiles += child.size;
              sizeAllFiles += child.size;
              ++countDirectFiles;
              ++countAllFiles;
            } else {
              ++countDirectFolders;
              ++countAllFolders;

              const childStats = buildStats(child.path_lower);
              directFolderStats[child.name] = childStats;

              sizeAllFiles += childStats.sizeAllFiles;
              countAllFiles += childStats.countAllFiles;
              countAllFolders += childStats.countAllFolders;
            }
          }

          return {
            name: folder.folderItem.name,
            path_lower: folder.folderItem.path_lower,
            sizeDirectFiles,
            countDirectFiles,
            countDirectFolders,
            sizeAllFiles,
            countAllFiles,
            countAllFolders,
            directFolderStats,
          };
        };

        const stats = buildStats("");

        const maxAge = 300;
        const expires = new Date(new Date().getTime() + maxAge * 1000);
        res.setHeader("Expires", expires.toUTCString());
        res.setHeader("Cache-Control", `private; max-age=${maxAge}`);

        const r = { root_stats: stats };
        res.json(r);
      })
      .catch((err) => {
        console.error("ERROR in /api/ls/all: ", err);
      });
  });
};
