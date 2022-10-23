# securenote


https://securenote.ca/



git tag -a v1 -m 'Version 1'

git push --tags

git describe --tags --long

git log -1 --format=%cd 

yarn build:production && bin/console cache:clear
