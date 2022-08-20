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
import SecureNote from './noteApp.js';
import moment from 'moment';


$(function() {
    
    $('#container-note-view').each(function(){

        (async () => {
        
            //calculate a hash on the key (the location hash), and request encrypted data from the
            //server by sending GUID and the keyHash - if both do not match we'll not get any data back.

            var urlHash = (window.location.hash).replace('#', '');
            var decryptingNoteApp = new SecureNote(urlHash); //pass the key
            var keyHash = await decryptingNoteApp.getKeyHash();

            $(window).on('hashchange', function() {
                (async () => {
                    urlHash = (window.location.hash).replace('#', '');
                    decryptingNoteApp.setKey(urlHash); //pass the key
                    keyHash = await decryptingNoteApp.getKeyHash();

                    loadData();
                })();
            });

            
            // var decryptedText = await decryptingNoteApp.decrypt( $('#tst-encrypted').val() );
            // $('#tst-decrypted').text(decryptedText);

            $('#confirm-destroy').on('click', function(){


                $.post(window.location.origin + window.location.pathname, {keyHash: keyHash, confirmDestroy: '1'}, function(data){
                    //decrypt and show
                    (async () => {
                        try {
                            var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                            $('textarea#secretnote').text(decryptedText).autogrow();
                            $('.secretnote-group').removeClass('hidden');

                            $('.loading-error').text("The note is now destroyed. Make sure to copy it before you leave this page, it's gone forever.").fadeIn('fast');
                            $('.alert-warning.confirmation-required').fadeOut('fast');

                            if(data.offer_delete) {
                                $('#delete-note').fadeIn('fast');
                            }

                        } catch (ex) {
                            $('.loading-error').text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                            $('.loading-error').show();
                        }
                    })();
                }, "json")
                .fail(function(xhr, status, error) {
    
                    try {
                        var response = JSON.parse(xhr.responseText);
                        $('.loading-error').text(response.status).fadeIn('fast');
    
                        if(response.detail) {
                            //probably an actual server error (symfony error in json?)
                            $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).fadeIn('fast');
                        }
    
                        if(response.destroyedOn) {
                            $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').fadeIn('fast');
                        }
    
                    } catch(e) {
                        alert( error + ' : ' + xhr.responseText );
    
                        $('.loading-error').text('Unexpected response').fadeIn('fast');
                    }
    
                    $('.loading-error').show();
                    
                })
                .always(function() {
                    $('.loading-temporary').hide();
                });;
            });

            $('#confirm-cancel').on('click', function(){
                window.location = '/';
            });

            $('#delete-note').on('click', function(){
                $.post(window.location.origin + '/delete' + window.location.pathname, {keyHash: keyHash, confirmDestroy: '1'}, function(data){
                    //manually delete

                    if(data.destroyed) {
                        $('.loading-error').text("The note was deleted. Make sure to copy it before you leave this page, it's gone forever.").fadeIn('fast');
                    } else {
                        $('.loading-error').text("The note was probably deleted; there may have been an error. There was an unexpected response from the server, but no error info.").fadeIn('fast');
                    }

                    $('#delete-note').fadeOut();

                   
                   
                }, "json")
                .fail(function(xhr, status, error) {
    
                    try {
                        var response = JSON.parse(xhr.responseText);
                        $('.loading-error').text(response.status).fadeIn('fast');
    
                        if(response.detail) {
                            //probably an actual server error (symfony error in json?)
                            $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).fadeIn('fast');
                        }
    
                        if(response.destroyedOn) {
                            $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').fadeIn('fast');
                        }
    
                    } catch(e) {
                        alert( error + ' : ' + xhr.responseText );
    
                        $('.loading-error').text('Unexpected response').fadeIn('fast');
                    }
    
                    $('.loading-error').show();
                    
                })
                .always(function() {
                    $('.loading-temporary').hide();
                });;
            });


            function loadData() {

                $('.loading-error').fadeOut('fast');
                $('.alert-warning.confirmation-required').fadeOut('fast');

                $.post(window.location.origin + window.location.pathname, {keyHash: keyHash}, function(data){


                    if(data.was_deleted) {
                        $('.loading-error').text('This note has just self destructed... To die, to sleep, No more...').fadeIn();
                    } else if(data.expires) {
                        $('.loading-error').text('This note will expire ' + moment(data.expires).from() + '.').fadeIn();
                    }
    
                    //if the note will self-destruct, we have to ask for confirmation first
                    if(data.confirmDestroy) {
    
                        $('.alert-warning.confirmation-required').fadeIn('fast');

                        $('#delete-note').fadeOut('fast');
    
                    } else {
                        (async () => {
                            //decrypt and show
                            try {
                                var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                                $('textarea#secretnote').text(decryptedText).autogrow();
                                $('.secretnote-group').removeClass('hidden');

                                if(data.offer_delete) {
                                    $('#delete-note').fadeIn('fast');
                                }

                            } catch (ex) {
                                $('.loading-error').text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                                $('.loading-error').show();
                            }
                        })();
                        
                    }
                
    
                }, "json")
                .fail(function(xhr, status, error) {
    
                    try {
                        var response = JSON.parse(xhr.responseText);
                        $('.loading-error').text(response.status).fadeIn('fast');
    
                        if(response.detail) {
                            //probably an actual server error (symfony error in json?)
                            $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).fadeIn('fast');
                        }
    
                        if(response.destroyedOn) {
                            $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').fadeIn('fast');
                        }
    
                    } catch(e) {
                        alert( error + ' : ' + xhr.responseText );
    
                        $('.loading-error').text('Unexpected response').fadeIn('fast');
                    }
    
                    $('.loading-error').show();
                    
                })
                .always(function() {
                    $('.loading-temporary').hide();
                });;
            }

            loadData();

        })();

    });


    $('#container-note-create').each(function(){

        
        $('#create-a-new-note').on('click', function(e){
            e.preventDefault();
            $('.saved-link-display').fadeOut('fast');
            $('#create-form-controls').fadeIn('fast');
            $('#create-a-new-note').fadeOut('fast');

        });

        $('#destroy-on-read').on('change', function(){
            if($(this).is(':checked')) {
                //copy original check of allow-delete
                $('#allow-delete').data('checked-state', $('#allow-delete').is(':checked'));
                $('#allow-delete').prop( "checked", false ).prop( "disabled", true );
            } else {
                $('#allow-delete').prop( "checked", $('#allow-delete').data('checked-state') ).prop( "disabled", false );
            }
        });

        $('form#form-note-create').on('submit', function(e){

            e.preventDefault();
            var $form = $(this);

            (async () => {

                var encryptingNoteApp = new SecureNote();
                var key = encryptingNoteApp.getKey();
                var keyHash = await encryptingNoteApp.getKeyHash();

                var encryptionError = false;

                var encryptedB65 = '';
                
                try {
                    encryptedB65 = await encryptingNoteApp.encrypt( $form.find('textarea[name="secretnote"]').val());
                } catch (ex) {
                    $('.saved-link-display').text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                    return;
                }
                

                

                var data = {
                    encrypted: encryptedB65,
                    keyhash: keyHash,
                    destroyonread: $form.find('input[name="destroy-on-read"]').is(':checked') ? 1: 0,
                    daystolive: $form.find('input[name="ttl"]').val(),
                    allowdelete: $form.find('input[name="allow-delete"]').is(':checked') ? 1: 0
                };

                $('.saved-link-display').text('Saving...').fadeIn('fast');


                $.post(window.location.origin + window.location.pathname, data, function(data){


                    var a = $('<a />')
                        .attr('href', data.link + '#' + key)
                        .text(data.link + '#' + key);
                
                    $('.saved-link-display').html('<strong>Link: </strong> ');
                    a.appendTo($('.saved-link-display'));


                    $('#create-form-controls').fadeOut('fast');
                    $('#create-a-new-note').fadeIn('fast');

        
                }, "json")
                .fail(function(xhr, status, error) {
        
                    try {
                        var response = JSON.parse(xhr.responseText);
                        $('.saved-link-display').text(response.status);
                    } catch(e) {
                        $('.saved-link-display').text('Unexpected response from server');
                    }
                        
                });

            })();
        });
    });



    $('#container-note-test #btn-encrypt').on('click', function(){

        (async () => {
            var encryptingNoteApp = new SecureNote();
            $('#tst-key').text(encryptingNoteApp.getKey());

            var encryptingKeyHash = await encryptingNoteApp.getKeyHash();
            $('#tst-key-hash').text(encryptingKeyHash);

            var encryptedB65 = await encryptingNoteApp.encrypt( $('#tst-source').val() );
            $('#tst-encrypted').text(encryptedB65);

            // test descrypt:

            var decryptingNoteApp = new SecureNote($('#tst-key').text()); //pass the key
        
            var decryptingKeyHash = await decryptingNoteApp.getKeyHash();
            $('#tst-key-hash-2').text(decryptingKeyHash);
            
            var decryptedText = await decryptingNoteApp.decrypt( $('#tst-encrypted').val() );
            $('#tst-decrypted').text(decryptedText);

        })();

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


