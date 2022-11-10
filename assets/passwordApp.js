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


function factoral(num) {
    var rval = 1;
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

//set n, of length k
//<sup>n</p>P<sub>r</sub> = n! / (n−r)!
function permutationsNonRepeat(n, k) {
    var p = factoral(n);
    var v = factoral(n - k);
    return p / v;
}

//set n, of length k
//<sup>n</p>P<sub>r</sub> = n<sup>r</sup>
function permutationsWithRepeat(n, k) {
    return BigInt(Math.pow(n, k));
}

function timeToBruteforce(n, k, computers, pps) {
    var data = {years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, hideLessThanYear: false};

    //we will /2 because that's the average
    var exp = BigInt(Math.pow(n, k));
    var ppsn = BigInt(pps);
    var computersn = BigInt(computers);
    var actualSecondsNeeded = Number(((exp / 2n) / ppsn) / computersn);

    if(actualSecondsNeeded >= 31536000)
    {
        //data.years = (actualSecondsNeeded / 31536000).toLocaleString();
        data.years = (actualSecondsNeeded / 31536000);
        data.months = (data.years % 1) * 12;
        data.days = (data.months % 1) * 30;
        data.hours = (data.days % 1) * 24;
        data.minutes = (data.hours % 1) * 60;
        data.seconds = (data.minutes % 1) * 60;   

        //did we overflow?
        if(data.years > Number.MAX_SAFE_INTEGER) {

            data.years = BigInt(((exp / 2n) / ppsn) / computersn).toLocaleString();


            //data.years = BigInt(data.years.toLocaleString().replace(/,/g, '')).toLocaleString();
            data.hideLessThanYear = true;
        } else {
            data.years = parseInt(data.years).toLocaleString();
        }

    } else if(actualSecondsNeeded >= 2592000) {
        data.months = actualSecondsNeeded / 2592000;
        data.days = (data.months % 1) * 30;
        data.hours = (data.days % 1) * 24;
        data.minutes = (data.hours % 1) * 60;
        data.seconds = (data.minutes % 1) * 60;    

    } else if(actualSecondsNeeded >= 86400) {
        data.days = actualSecondsNeeded / 86400;
        data.hours = (data.days % 1) * 24;
        data.minutes = (data.hours % 1) * 60;
        data.seconds = (data.minutes % 1) * 60;   

    } else if(actualSecondsNeeded >= 3600) {
        data.hours = actualSecondsNeeded / 3600;
        data.minutes = (data.hours % 1) * 60;
        data.seconds = (data.minutes % 1) * 60;  

    } else if(actualSecondsNeeded >= 60) {
        data.minutes = actualSecondsNeeded / 60;
        data.seconds = (data.minutes % 1) * 60;    

    } else {
        data.seconds = actualSecondsNeeded;    
    }
    
    data.months = parseInt(data.months).toLocaleString();
    data.days = parseInt(data.days).toLocaleString();
    data.hours = parseInt(data.hours).toLocaleString();
    data.minutes = parseInt(data.minutes).toLocaleString();
    data.seconds = parseInt(data.seconds).toLocaleString();

    return data;
}

export default class PasswordGenerator {

    getPassword(length, charset) {
        return randomString(length, charset);
    }

    countPermutationsNoRpeat(length, charset) {
        return (permutationsNonRepeat(charset.length, length)).toLocaleString();
    }

    countPermutationsWithRepeat(length, charset) {
        return (permutationsWithRepeat(charset.length, parseInt(length))).toLocaleString();
    }

    timeToBruteforce(length, charset, computers, pps) {
        return timeToBruteforce(charset.length, parseInt(length), computers, pps);
    }


    

}
