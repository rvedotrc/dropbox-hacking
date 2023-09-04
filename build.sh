# Because the build-order doesn't work yet

yarn workspace dropbox-hacking-util build

yarn workspace dropbox-hacking-downloader build
yarn workspace dropbox-hacking-lister build
yarn workspace dropbox-hacking-ls-cache build
yarn workspace dropbox-hacking-mover build
yarn workspace dropbox-hacking-uploader build

yarn workspace dropbox-hacking-sync build

yarn workspace dropbox-hacking-cli build

yarn workspaces run build
