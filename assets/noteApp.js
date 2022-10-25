async function getHash(str) {
    const msgUint8 = new TextEncoder().encode(str); 
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); 
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); 
    return hashHex;
}

function prepareTextForEncryption(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function prepareb64AfterDecryption(b64) {
    return decodeURIComponent(escape(window.atob(b64)))
}

function ab2str(buf) {
    return new TextDecoder().decode(buf);
}

function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function b642ab(base64) {
    // https://stackoverflow.com/a/21797381/9014097
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function ab2b64( buffer ) { //_arrayBufferToBase64
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function randomString(length) { // https://security.stackexchange.com/questions/181580/why-is-math-random-not-designed-to-be-cryptographically-secure
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var i;
    var result = "";
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';

    if(window.crypto && window.crypto.getRandomValues){

        var values = new Uint32Array(length);
        window.crypto.getRandomValues(values);

        for(i=0; i<length; i++) {
            result += charset[values[i] % charset.length];
        }

        return result;

    } else if(isOpera) {//Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
       
        for(i=0; i<length; i++) {
            result += charset[Math.floor(Math.random()*charset.length)];
        }
        
        return result;
    }
    else throw new Error("Your browser sucks and can't generate secure random numbers");
}

async function encrypt(sourceText, keyData, iv) {
    var key = await importKey(keyData);
    var data = str2ab(sourceText);

    return await crypto.subtle.encrypt(
        { name: "AES-CBC", iv: iv },
        key,
        data 
    );        
}

async function decrypt(encrypted, keyData, iv) {
    var key = await importKey(keyData);
    var data = b642ab(encrypted);

    return await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: iv },
        key,
        data
    );
}

async function importKey(keyData) {
    var key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-CBC" },
        true,
        ["decrypt", "encrypt"]
    );

    return key;
}

export default class SecureNote {

    constructor(keyText) {
        this.setKey(keyText);
    }

    setKey(keyText) {

        this.iv = new Uint8Array(16).buffer;

        if(!keyText) {
            keyText = randomString(32)
        }

        this.keyText = keyText;
        this.keyData = str2ab(this.keyText);
    }

    getKey() {
        return this.keyText;
    }

    async getKeyHash() {
        return await getHash(this.keyText);
    }

    async encrypt(text) { //returns b64
        var sourceText = prepareTextForEncryption(text);
        var encrypted = await encrypt(sourceText, this.keyData, this.iv);

        return ab2b64(encrypted); 
    }

    async decrypt(encryptedb64) { //returns string, the decrypted text
        var decrypted = await decrypt(encryptedb64, this.keyData, this.iv);
        var decryptedText = prepareb64AfterDecryption(ab2str(decrypted));
    
        return decryptedText; 
    }
}
