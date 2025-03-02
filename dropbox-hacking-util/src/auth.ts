import * as child_process from "child_process";
import { Dropbox, DropboxAuth } from "dropbox";
import express from "express";
import * as fs from "fs";

import { writeStderr } from "./logging.js";
import { readFile } from "fs/promises";

const envVar = "DROPBOX_CREDENTIALS_PATH";

const port = 9988;
const redirectUri = `http://localhost:${port}/auth`; // has to match app's config

export type DropboxProvider = () => Promise<Dropbox>;

const runServer = async (appAuth: DropboxAuth): Promise<DropboxAuth> =>
  new Promise((resolve, reject) => {
    const app = express();
    const server = app.listen(port, "localhost", () => {
      // console.log("Listening on", server.address());
    });

    // server.on("close", () => console.debug("Server close"));
    // server.on("error", (err: Error) => console.error("Server error:", err));

    app.get("/", (_req, res) => {
      // console.debug("/");

      appAuth
        .getAuthenticationUrl(redirectUri, "myState", "code", "offline")
        .then((authUrl) => {
          // console.debug(`=> ${authUrl.toString()}`);
          res.writeHead(302, { Location: authUrl.toString() });
          res.end();
        })
        .catch((err) => console.error("getAuthenticationUrl failed:", err));
    });

    app.get("/auth", (req, res) => {
      const code = req.query.code;
      // console.debug("/auth");

      if (typeof code !== "string") {
        // console.debug("not a string");
        res.writeHead(400);
        res.end();
        return;
      }

      updateAuthFromCode(appAuth, code).then(
        () => {
          res.writeHead(200);
          res.write(
            "Dropbox authorization successful. You may close this window.",
          );
          res.end();

          server.close();
          resolve(appAuth);
        },
        (err) => {
          console.error("checkCode", err);
          res.writeHead(500);
          res.write(`${err}`);
          res.end();
          reject(new Error("OAuth2 flow failed"));
        },
      );
    });

    const startUrl = `http://localhost:${port}/`;
    void writeStderr(
      `To authorize this application to use your Dropbox, please go to the following url:\n` +
        `${startUrl}\n`,
    );

    child_process.spawn("open", [startUrl], {
      stdio: ["ignore", "ignore", "ignore"],
    });
  });

const updateAuthFromCode = async (
  auth: DropboxAuth,
  code: string,
): Promise<void> => {
  const t0 = new Date().getTime();

  const token = await auth.getAccessTokenFromCode(redirectUri, code);
  const result_2 = token.result as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    uid: string;
    account_id: string;
  };
  auth.setAccessToken(result_2.access_token);
  auth.setAccessTokenExpiresAt(new Date(t0 + result_2.expires_in * 1000));
  auth.setRefreshToken(result_2.refresh_token);
};

let saveSeq = 0;

const saveUserCredentials = async (
  credentials: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  auth: DropboxAuth,
  credentialsPath: string,
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const newPayload = {
    ...credentials,
    user_oauth_config: {
      access_token: auth.getAccessToken(),
      access_token_expires_at: auth.getAccessTokenExpiresAt().getTime(),
      refresh_token: auth.getRefreshToken(),
    },
  };

  const tmpFile = credentialsPath + `.tmp.${saveSeq++}`;

  await fs.promises.writeFile(
    tmpFile,
    JSON.stringify(newPayload, null, 2) + "\n",
    {
      encoding: "utf-8",
      mode: 384,
    },
  );

  await fs.promises.rename(tmpFile, credentialsPath);
};

type SavedCredentials = {
  access_token: string;
  app: {
    app_key: string;
    app_secret: string;
  };
  user_oauth_config:
    | undefined
    | {
        access_token: string;
        access_token_expires_at: number;
        refresh_token: string;
      };
};

const checkAndRefresh = async (
  credentials: SavedCredentials,
  credentialsPath: string,
): Promise<DropboxAuth | undefined> => {
  if (!credentials.user_oauth_config) return undefined;

  console.debug("Using cached auth_config");

  const auth = new DropboxAuth({
    clientId: credentials.app.app_key,
    clientSecret: credentials.app.app_secret,
  });
  const userOAuthConfig = credentials.user_oauth_config;

  auth.setAccessToken(userOAuthConfig.access_token);
  auth.setAccessTokenExpiresAt(
    new Date(userOAuthConfig.access_token_expires_at),
  );
  auth.setRefreshToken(userOAuthConfig.refresh_token);

  // console.debug("checkAndRefreshAccessToken", JSON.stringify(auth));

  // Incorrect signature; actually returns Promise<void>
  return (auth.checkAndRefreshAccessToken() as unknown as Promise<void>)
    .then(() => {
      // console.debug("after refresh", JSON.stringify(auth));
      saveUserCredentials(credentials, auth, credentialsPath).catch((err) =>
        console.error("saveUserCredentials failed:", err),
      );
      return auth;
    })
    .catch((err) => {
      console.error("checkAndRefreshAccessToken failed:", err);
      return undefined;
    });
};

const reauthorize = async (
  credentials: SavedCredentials,
  credentialsPath: string,
): Promise<DropboxAuth> => {
  return new Promise((resolve, _reject) => {
    runServer(
      new DropboxAuth({
        clientId: credentials.app.app_key,
        clientSecret: credentials.app.app_secret,
      }),
    )
      .then((filledInAuth) => {
        saveUserCredentials(credentials, filledInAuth, credentialsPath).catch(
          (err) => console.error(`Failed to cache credentials: ${err}`),
        );

        resolve(filledInAuth);
      })
      .catch((err) => console.error("runServer error:", err));
  });
};

export const getDropboxClient = async (): Promise<Dropbox> => {
  const credentialsPath = process.env[envVar];

  if (credentialsPath === undefined) throw new Error(`${envVar} is not set`);

  const credentials = JSON.parse(
    await readFile(credentialsPath, { encoding: "utf-8" }),
  ) as SavedCredentials;

  return await checkAndRefresh(credentials, credentialsPath)
    .then((auth) => auth ?? reauthorize(credentials, credentialsPath))
    .then((auth) => new Dropbox({ auth }));
};
