/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/layout.scss';
import './styles/app.scss';

// start the Stimulus application
//import './bootstrap';


import $ from 'jquery';
$(function() {
    
    $('#container-note-view').each(function(){
        //after page loads, we look at hash, and post it to /n/{guid} - payload: hash=hash

        $.post(window.location.origin + window.location.pathname, {key: (window.location.hash).replace('#', '')}, function(data){


            if(data.was_deleted) {
                $('.loading-error').text('This note has just self destructed... To die, to sleep, No more...').fadeIn();
            }
            
            $('textarea#secretnote').text(data.decrypted).autogrow();
    
            $('.secretnote-group').removeClass('hidden');

           

        }, "json")
        .fail(function(xhr, status, error) {

            try {
                var response = JSON.parse(xhr.responseText);
                $('.loading-error').text(response.status);
            } catch(e) {
                alert( error + ' : ' + xhr.responseText );

                $('.loading-error').text('Unexpected response');
            }

            $('.loading-error').show();
            
        })
        .always(function() {
            $('.loading-temporary').hide();
        });;

    });


    $('#container-note-create').each(function(){
        $('form#form-note-create').on('submit', function(e){

            var $form = $(this);
            e.preventDefault();

            var data = {
                securenote: $form.find('textarea[name="secretnote"]').val(),
                destroyonread: $form.find('input[name="destroy-on-read"]').is(':checked') ? 1: 0,
                daystolive: $form.find('input[name="ttl"]').val()
            };

            $('.saved-link-display').text('Saving...').fadeIn('fast');


            $.post(window.location.origin + window.location.pathname, data, function(data){


                var a = $('<a />')
                    .attr('href', data.link)
                    .text(data.link);
            
                $('.saved-link-display').html('<strong>Link: </strong> ');
                a.appendTo($('.saved-link-display'));
    
            }, "json")
            .fail(function(xhr, status, error) {
    
                try {
                    var response = JSON.parse(xhr.responseText);
                    $('.saved-link-display').text(response.status);
                } catch(e) {
                    $('.saved-link-display').text('Unexpected response from server');
                }
                    
            });
        });
    });

});



$(function() {
    /**
     * Auto-growing textareas; technique ripped from Facebook
     * 
     * 
     * http://github.com/jaz303/jquery-grab-bag/tree/master/javascripts/jquery.autogrow-textarea.js
     */

    $.fn.autogrow = function(options)
    {
        return this.filter('textarea').each(function()
        {
            var self         = this;
            var $self        = $(self);
            var minHeight    = $self.height();
            var noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;
            var settings = $.extend({
                preGrowCallback: null,
                postGrowCallback: null
              }, options );

            var shadow = $('<div></div>').css({
                position:    'absolute',
                top:         -10000,
                left:        -10000,
                width:       $self.width(),
                fontSize:    $self.css('fontSize'),
                fontFamily:  $self.css('fontFamily'),
                fontWeight:  $self.css('fontWeight'),
                lineHeight:  $self.css('lineHeight'),
                resize:      'none',
    			'word-wrap': 'break-word'
            }).appendTo(document.body);

            var update = function(event)
            {
                var times = function(string, number)
                {
                    for (var i=0, r=''; i<number; i++) r += string;
                    return r;
                };

                var val = self.value.replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/\n$/, '<br/>&#xa0;')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/ {2,}/g, function(space){ return times('&#xa0;', space.length - 1) + ' ' });

				// Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
				if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13) {
					val += '<br />';
				}

                shadow.css('width', $self.width());
                shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
                
                var newHeight=Math.max(shadow.height() + noFlickerPad, minHeight);
                if(settings.preGrowCallback!=null){
                  newHeight=settings.preGrowCallback($self,shadow,newHeight,minHeight);
                }
                
                $self.height(newHeight);
                
                if(settings.postGrowCallback!=null){
                  settings.postGrowCallback($self);
                }
            }

            $self.change(update).keyup(update).keydown({event:'keydown'},update);
            $(window).resize(update);

            update();
        });
    };

    $('textarea.autogrow').css('overflow', 'hidden').autogrow();
});



function randomString(length) {
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

    } else if(isOpera)//Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
    {
        for(i=0; i<length; i++) {
            result += charset[Math.floor(Math.random()*charset.length)];
        }
        return result;
    }
    else throw new Error("Your browser sucks and can't generate secure random numbers");
}


function prepareTextForEncryption(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function prepareb64AfterDecryption(b64) {
    return decodeURIComponent(escape(window.atob(b64)))
}

$('#container-note-test #btn-encrypt').on('click', function(){

    //var newKey = window.crypto.randomUUID().replace('-', '');


    ///ALWAYS atob before encrypted, and btoa after decrypting

    var newKey = randomString(32);
    $('#tst-key').text(newKey);
    

    var sourceText = prepareTextForEncryption($('#tst-source').val());
    
    var keyData = str2ab(newKey);


    var iv = new Uint8Array(16).buffer;
    var ciphertext = b642ab("i4+WxNH8XYMnAm7RsRkfOw==");

    (async () => {

        var keyHash = await getHash(newKey);
        $('#tst-key-hash').text((keyHash));
        
        var encrypted = await encrypt(sourceText);
        console.log('encrypted', encrypted);
        $('#tst-encrypted').text( ab2b64(encrypted) );
        //

        var decrypted = await decrypt( $('#tst-encrypted').text() );
        var decryptedText = prepareb64AfterDecryption(ab2str(decrypted));

        $('#tst-decrypted').text(decryptedText);

        console.log('ab2str decrypted', decryptedText);
        var decryptedStr = new TextDecoder().decode(decrypted);
        console.log('TextDecoder decrypted', decryptedStr);


    })();

    async function encrypt(sourceText) {
        var key = await importKey();
        var data = str2ab(sourceText);

        console.log('encrypting', sourceText, ab2str(data));

        try {
            return await crypto.subtle.encrypt(
            { name: "AES-CBC", iv: iv },
            key,
            data //ArrayBuffer of data you want to encrypt
            );
        } catch (ex) {
            console.error("Error: Name: ", ex.name, ", Message: ", ex.message);
        }
           
    }

    async function decrypt(encrypted) {
        var key = await importKey();
        var data = b642ab(encrypted);

        console.log('decrypting', encrypted, ab2str(data));

        try {
            return await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: iv },
            key,
            data
            );
        } catch (ex) {
            console.error("Error: Name: ", ex.name, ", Message: ", ex.message);
        }
    }

    async function importKey() {
        var key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "AES-CBC" },
            true,
            ["decrypt", "encrypt"]
        );
        return key;
    }

    // Helper -----------------------------------------------

    async function getHash(str) {

        const msgUint8 = new TextEncoder().encode(str); 
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
       //return await crypto.subtle.digest("SHA-256", str2ab(str));
    }

    // https://stackoverflow.com/a/11058858

    function ab2str(buf) {
        //return String.fromCharCode.apply(null, new Uint16Array(buf));
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

    // https://stackoverflow.com/a/21797381/9014097
    function b642ab(base64) {
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


    // window.crypto.subtle.generateKey(
    // {
    //     name: "AES-GCM",
    //     length: 256, //can be  128, 192, or 256
    // },
    //     false, //whether the key is extractable (i.e. can be used in exportKey)
    //     ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    // )
    // .then(function(key){
    //     //returns a key object
    //     console.log(key);
    //     $('#tst-key').text(key);

    //     var data = $('#tst-source').text();

    //     window.crypto.subtle.encrypt(
    //         {
    //             name: "AES-GCM",

    //             //Don't re-use initialization vectors!
    //             //Always generate a new iv every time your encrypt!
    //             //Recommended to use 12 bytes length
    //             iv: window.crypto.getRandomValues(new Uint8Array(12)),

    //             //Additional authentication data (optional)
    //             additionalData: ArrayBuffer,

    //             //Tag length (optional)
    //             tagLength: 128, //can be 32, 64, 96, 104, 112, 120 or 128 (default)
    //         },
    //         key, //from generateKey or importKey above
    //         data //ArrayBuffer of data you want to encrypt
    //     )
    //     .then(function(encrypted){
    //         //returns an ArrayBuffer containing the encrypted data
    //         console.log(new Uint8Array(encrypted));
            
    //         $('#tst-encrypted').text(btoa(new Uint8Array(encrypted)));


    //         window.crypto.subtle.decrypt(
    //             {
    //                 name: "AES-GCM",
    //                 iv: ArrayBuffer(12), //The initialization vector you used to encrypt
    //                 additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
    //                 tagLength: 128, //The tagLength you used to encrypt (if any)
    //             },
    //             key, //from generateKey or importKey above
    //             data //ArrayBuffer of the data
    //         )
    //         .then(function(decrypted){
    //             //returns an ArrayBuffer containing the decrypted data
    //             console.log(new Uint8Array(decrypted));
    //         })
    //         .catch(function(err){
    //             console.error(err);
    //         });




    //     })
    //     .catch(function(err){
    //         console.error(err);
    //     });


    // })
    // .catch(function(err){
    //     console.error(err);
    // });

});