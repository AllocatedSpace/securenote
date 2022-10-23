#!/bin/bash

## on remote, yarn build && php bin/console cache:clear

# buildversion="$1"
buildversion=$(git describe --tags --long | sed --expression='s/-/./g')
builddate=$(git log -1 --format=%cd )

echo "Writing $buildversion - $builddate to templates/build-id.html"
echo "$buildversion - $builddate" > templates/build-id.html


sudo /var/www/lib/sbin/fsync -c -d assets/* assets/**/* config/* config/**/* migrations/* migrations/*/** public/favicon/* \
 public/favicon/**/* public/images/* public/images/**/* public/favicon.ico \
 public/robots.txt public/sitemap.xml src/* src/**/* templates/**/* templates/* tests/* tests/**/* translations/* translations/**/* package.json sync.sh webpack.config.js