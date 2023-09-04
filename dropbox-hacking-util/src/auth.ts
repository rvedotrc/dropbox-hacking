import { Dropbox, DropboxAuth } from "dropbox";
import * as fs from "fs";
import * as express from "express";
import * as child_process from "child_process";
import { writeStderr } from "./logging";

const envVar = "DROPBOX_CREDENTIALS_PATH";

const port = 9988;
const redirectUri = `http://localhost:${port}/auth`; // has to match app's config

export type DropboxProvider = () => Promise<Dropbox>;

const runServer = async (
  appAuth: DropboxAuth,
  checkCode: (code: string) => Promise<void>,
): Promise<void> => {
  const app = express();
  const server = app.listen(port, "localhost");

  app.get("/", (req, res) => {
    console.debug("/");
    appAuth
      .getAuthenticationUrl(redirectUri, "myState", "code", "offline")
      .then((authUrl) => {
        console.debug(`=> ${authUrl}`);
        res.writeHead(302, { Location: authUrl.toString() });
        res.end();
      });
  });

  app.get("/auth", (req, res) => {
    const code = req.query.code;

    if (typeof code !== "string") {
      console.debug("not a string");
      res.writeHead(400);
      res.end();
      return;
    }

    checkCode(code).then(
      () => {
        res.writeHead(200);
        res.write(
          "Dropbox authorization successful. You may close this window.",
        );
        res.end();

        server.close();
      },
      (err) => {
        console.error("checkCode", err);
        res.writeHead(500);
        res.write(`${err}`);
        res.end();
      },
    );
  });

  const startUrl = `http://localhost:${port}/`;
  await writeStderr(
    `To authorize this application to use your Dropbox, please go to the following url:\n` +
      `${startUrl}\n`,
  );

  child_process.spawn("open", [startUrl], {
    stdio: ["ignore", "ignore", "ignore"],
  });
};

const updateAuthFromCode = (auth: DropboxAuth, code: string): Promise<void> => {
  const t0 = new Date().getTime();

  return auth.getAccessTokenFromCode(redirectUri, code).then((token) => {
    const result = token.result as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
      uid: string;
      account_id: string;
    };

    auth.setAccessToken(result.access_token);
    auth.setAccessTokenExpiresAt(new Date(t0 + result.expires_in * 1000));
    auth.setRefreshToken(result.refresh_token);
  });
};

let saveSeq = 0;

const saveUserCredentials = (
  credentials: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  auth: DropboxAuth,
  credentialsPath: string,
): Promise<void> => {
  const newPayload = {
    ...credentials,
    user_oauth_config: {
      access_token: auth.getAccessToken(),
      access_token_expires_at: auth.getAccessTokenExpiresAt().getTime(),
      refresh_token: auth.getRefreshToken(),
    },
  };

  const tmpFile = credentialsPath + `.tmp.${saveSeq++}`;

  return fs.promises
    .writeFile(tmpFile, JSON.stringify(newPayload, null, 2) + "\n", {
      encoding: "utf-8",
      mode: 0o600,
    })
    .then(() => fs.promises.rename(tmpFile, credentialsPath));
};

export const getDropboxClient = async (): Promise<Dropbox> =>
  new Promise((resolve, reject) => {
    const credentialsPath = process.env[envVar];
    if (credentialsPath === undefined) return reject(`${envVar} is not set`);

    const credentials = JSON.parse(fs.readFileSync(credentialsPath).toString());

    const auth = new DropboxAuth({
      clientId: credentials.app.app_key,
      clientSecret: credentials.app.app_secret,
    });

    if (credentials.user_oauth_config) {
      // console.debug("Using cached auth_config");

      const userOAuthConfig: {
        access_token: string;
        access_token_expires_at: number;
        refresh_token: string;
      } = credentials.user_oauth_config;

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
          saveUserCredentials(credentials, auth, credentialsPath);
          const dbx = new Dropbox({ auth });
          return resolve(dbx);
        })
        .catch((err) => {
          console.error("checkAndRefreshAccessToken", err);
        });
    }

    runServer(
      auth,
      (code: string): Promise<void> =>
        updateAuthFromCode(auth, code).then(() => {
          saveUserCredentials(credentials, auth, credentialsPath).catch((err) =>
            console.error(`Failed to cache credentials: ${err}`),
          );

          resolve(new Dropbox({ auth }));
        }),
    );
  });
