function randomString(length, charset) { // https://security.stackexchange.com/questions/181580/why-is-math-random-not-designed-to-be-cryptographically-secure
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

export default class PasswordGenerator {

    getPassword(length, charset) {
        return randomString(length, charset);
    }

}
