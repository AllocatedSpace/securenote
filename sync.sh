#!/bin/bash


# buildversion="$1"
buildversion=$(git describe --tags --long)
builddate=$(git log -1 --format=%cd )

echo "Writing $buildversion - $builddate to templates/build-id.html"
echo "$buildversion - $builddate" > templates/build-id.html