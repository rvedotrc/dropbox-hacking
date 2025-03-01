# Dropbox Hacking

For now, this is me hacking around with the Dropbox v2 API in Typescript.

Primarily this comes in the form of a simple command-line interface to a handful of operations:

- cat: download file
- content-hash-stdin: calculate the Dropbox content_hash
- cp: copy
- ls: list directory
- mkdir
- mv: move
- rm: delete
- sync-download: recursive download
- sync-upload: recursive upload
- upload-stdin: upload file

```shell
make
./bin/cli
```

## Authorization

You'll need an app key and an app secret.

To get them, [create an app](https://www.dropbox.com/developers/apps) in Dropbox, and add
`http://localhost:9988/auth` as a redirect URI. Set the permissions to:

- files.metadata.write
- files.content.write
- files.content.read

Find the app key and app secret and save them in a JSON file somewhere, with this structure:

```json
{
  "app": {
    "app_key": "YOUR_APP_KEY",
    "app_secret": "YOUR_APP_SECRET"
  }
}
```

In order for the CLI to find these credentials, set the environment variable `DROPBOX_CREDENTIALS_PATH`
to the path to the JSON file. For example, if it's `dropbox.json` in your home directory, then use:

```shell
export DROPBOX_CREDENTIALS_PATH=$HOME/dropbox.json
```

Then do something, e.g. list the root directory of your dropbox:

```shell
./bin/cli ls ""
```

## Other tools

- `./bin/process-camera-uploads` - move files around automatically
- `./bin/exif-cache` - maintain a cache of EXIF data from all `*.jpg` files
- `./bin/ls-cache` - maintain a cache of all or part of a dropbox

## Building

- Install the dependencies listed in `.tool-versions` (e.g. using `asdf`)
- `pnpm clean`
- `pnpm install-all`
- `pnpm build-all`
