#!/bin/bash


# buildversion="$1"
buildversion=$(git describe --tags --long | sed --expression='s/-/./g')
builddate=$(git log -1 --format=%cd )

echo "Writing $buildversion - $builddate to templates/build-id.html"
echo "$buildversion - $builddate" > templates/build-id.html


sudo /var/www/lib/sbin/fsync -d assets/* config/* migrations/* public/favicon/* public/images/* public/favicon.ico \
 public/robots.txt public/sitemap.xml src/* templates/* tests/* translations/* package.json sync.sh webpack.config.js