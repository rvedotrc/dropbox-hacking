#!/bin/bash

set -ex

# Because the build-order doesn't work yet

yarn workspace dropbox-hacking-util build

yarn workspace dropbox-hacking-downloader build &
yarn workspace dropbox-hacking-lister build &
yarn workspace dropbox-hacking-ls-cache build &
yarn workspace dropbox-hacking-mover build &
yarn workspace dropbox-hacking-uploader build &
wait

yarn workspace dropbox-hacking-exif-db build &
yarn workspace dropbox-hacking-mediainfo-db build &
yarn workspace dropbox-hacking-sync build &
wait

yarn workspace dropbox-hacking-cli build &
yarn workspace dropbox-hacking-photo-manager-server build &
wait

yarn workspace dropbox-hacking-photo-manager-client build
