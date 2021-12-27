# Dropbox Hacking

For now, this is me hacking around with the Dropbox v2 API in Typescript.

Primarily this comes in the form of a simple command-line interface to a handful of operations:

 - upload file
 - cat (download) file
 - copy
 - move
 - delete
 - mkdir
 - list directory (ls)
 
```shell
yarn
yarn build
./bin/cli
```

## Authorization

You'll need an access token.

To get a token, [create an app](https://www.dropbox.com/developers/apps) in Dropbox,
then select "Generate access token".

The access token needs to go in a JSON file somewhere, with this structure:

```json
{
  "token": "YOUR_ACCESS_TOKEN_HERE"
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
