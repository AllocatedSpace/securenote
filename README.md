# securenote


https://securenote.ca/


Self destructing 128-bit encrypted notes that are encrypted and decrypted in the browser. The key is transient (stored only in the link's location.hash).


`git tag -a v1 -m 'Version 1' && 
git push --tags && 
git describe --tags --long && 
git log -1 --format=%cd` 

`yarn build:production && bin/console cache:clear`
