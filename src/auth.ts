import { Dropbox, DropboxAuth } from "dropbox";
import * as fs from "fs";
import * as express from "express";
import * as child_process from "child_process";

const envVar = "DROPBOX_CREDENTIALS_PATH";

const port = 9988;
const redirectUri = `http://localhost:${port}/auth`; // has to match app's config

type UserOAuthConfig = {
  access_token: string;
  access_token_expires_at: number;
  refresh_token: string;
};

const runServer = (
  appAuth: DropboxAuth,
  checkCode: (code: string) => Promise<void>
): void => {
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
          "Dropbox authorization successful. You may close this window."
        );
        res.end();

        server.close();
      },
      (err) => {
        console.error("checkCode", err);
        res.writeHead(500);
        res.write(`${err}`);
        res.end();
      }
    );
  });

  const startUrl = `http://localhost:${port}/`;
  process.stderr.write(
    `To authorize this application to use your Dropbox, please go to the following url:\n`
  );
  process.stderr.write(`${startUrl}\n`);

  child_process.spawn("open", [startUrl], {
    stdio: ["ignore", "ignore", "ignore"],
  });
};

const makeAuth = (config: UserOAuthConfig) =>
  new DropboxAuth({
    accessToken: config.access_token,
    accessTokenExpiresAt: new Date(config.access_token_expires_at),
    refreshToken: config.refresh_token,
  });

const getUserOAuthConfig = (
  appAuth: DropboxAuth,
  code: string
): Promise<UserOAuthConfig> => {
  const t0 = new Date().getTime();

  return appAuth.getAccessTokenFromCode(redirectUri, code).then((token) => {
    const result = token.result as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
      uid: string;
      account_id: string;
    };

    const config: UserOAuthConfig = {
      access_token: result.access_token,
      access_token_expires_at: t0 + result.expires_in * 1000,
      refresh_token: result.refresh_token,
    };

    return config;
  });
};

const saveUserCredentials = (
  credentials: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  user_oauth_config: UserOAuthConfig,
  credentialsPath: string
): Promise<void> => {
  const newPayload = {
    ...credentials,
    user_oauth_config,
  };

  const tmpFile = credentialsPath + ".tmp"; // unsafe

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

    if (credentials.user_oauth_config) {
      // console.debug("Using cached auth_config");
      const config: UserOAuthConfig = credentials.user_oauth_config;
      return resolve(new Dropbox({ auth: makeAuth(config) }));
    }

    const appAuth = new DropboxAuth({
      clientId: credentials.app.app_key,
      clientSecret: credentials.app.app_secret,
    });

    runServer(
      appAuth,
      (code: string): Promise<void> =>
        getUserOAuthConfig(appAuth, code).then((config) => {
          saveUserCredentials(credentials, config, credentialsPath).catch(
            (err) => console.error(`Failed to cache credentials: ${err}`)
          );

          resolve(new Dropbox({ auth: makeAuth(config) }));
        })
    );
  });
