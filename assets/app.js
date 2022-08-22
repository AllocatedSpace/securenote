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


require('bootstrap');
import { Modal } from 'bootstrap';


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

                var reCaptchaSiteKey = $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('value');

                grecaptcha.ready(function() {
                    grecaptcha.execute(reCaptchaSiteKey, {action: 'readNote'}).then(function(recaptchaToken) { 

                        $.post(window.location.origin + window.location.pathname, {keyHash: keyHash, confirmDestroy: '1', recaptchaToken: recaptchaToken}, function(data){
                            //decrypt and show
                            (async () => {
                                try {
                                    var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                                    
                                    $('.secretnote-group').show();
                                    $('textarea#secretnote').show().text(decryptedText).autogrow(); //triggerHandler('change');

                                    $('.loading-error').text("The note is now destroyed. Make sure to copy it before you leave this page, it's gone forever.").show();
                                    $('.alert-warning.confirmation-required').hide();

                                    if(data.offer_delete) {
                                        $('#delete-note').fadeIn('fast');
                                    }

                                    

                                    gtag('event', 'confirm-destroy-note', { 'event_category': 'notes', 'event_label': 'Read and Destroy' });


                                } catch (ex) {
                                    $('.loading-error').text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                                    $('.loading-error').show();
                                }
                            })();
                        }, "json")
                        .fail(function(xhr, status, error) {
            
                            try {
                                var response = JSON.parse(xhr.responseText);
                                $('.loading-error').text(response.status).show();
            
                                if(response.detail) {
                                    //probably an actual server error (symfony error in json?)
                                    $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).show();
                                }
            
                                if(response.destroyedOn) {
                                    $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                }
            
                            } catch(e) {
                                alert( error + ' : ' + xhr.responseText );
            
                                $('.loading-error').text('Unexpected response').show();
                            }
            
                            $('.loading-error').show();
                            
                        })
                        .always(function() {
                            $('.loading-temporary').hide();
                        });;

                        //captcha
                    });
                }); //captcha
            });

            $('#confirm-cancel').on('click', function(){
                window.location = '/';
            });

            $('#delete-note').on('click', function(){

                var reCaptchaSiteKey = $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('value');

                grecaptcha.ready(function() {
                    grecaptcha.execute(reCaptchaSiteKey, {action: 'deleteNote'}).then(function(recaptchaToken) { 

                        $.post(window.location.origin + '/delete' + window.location.pathname, {keyHash: keyHash, confirmDestroy: '1', recaptchaToken: recaptchaToken}, function(data){
                            //manually delete

                            if(data.destroyed) {
                                $('.loading-error').text("The note was deleted. Make sure to copy it before you leave this page, it's gone forever.").show();
                            } else {
                                $('.loading-error').text("The note was probably deleted; there may have been an error. There was an unexpected response from the server, but no error info.").show();
                            }

                            $('#delete-note').fadeOut();

                            gtag('event', 'manual-destroy-note', { 'event_category': 'notes', 'event_label': 'Manual Delete' });
                            

                        
                        
                        }, "json")
                        .fail(function(xhr, status, error) {
            
                            try {
                                var response = JSON.parse(xhr.responseText);
                                $('.loading-error').text(response.status).show();
            
                                if(response.detail) {
                                    //probably an actual server error (symfony error in json?)
                                    $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).show();
                                }
            
                                if(response.destroyedOn) {
                                    $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                }
            
                            } catch(e) {
                                alert( error + ' : ' + xhr.responseText );
            
                                $('.loading-error').text('Unexpected response').show();
                            }
            
                            $('.loading-error').show();
                            
                        })
                        .always(function() {
                            $('.loading-temporary').hide();
                        });;

                    });
                }); //captcha

            });


            function loadData() {

                $('.loading-error').hide();
                $('.alert-warning.confirmation-required').hide();


                var reCaptchaSiteKey = $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('value');

                grecaptcha.ready(function() {
                    grecaptcha.execute(reCaptchaSiteKey, {action: 'readNote'}).then(function(recaptchaToken) { 

                        $.post(window.location.origin + window.location.pathname, {keyHash: keyHash, recaptchaToken: recaptchaToken}, function(data){


                            if(data.was_deleted) {
                                $('.loading-error').text('This note has just self destructed... To die, to sleep, No more...').show();
                            } else if(data.expires) {
                                $('.loading-error').text('This note will expire ' + moment(data.expires).from() + '.').show();
                            }
            
                            //if the note will self-destruct, we have to ask for confirmation first
                            if(data.confirmDestroy) {
            
                                $('.alert-warning.confirmation-required').show();

                                $('#delete-note').hide();
            
                            } else {



                                gtag('event', 'read-note', { 'event_category': 'notes', 'event_label': 'Read Note' });
                               

                                (async () => {
                                    //decrypt and show
                                    try {
                                        var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                                        $('.secretnote-group').show();
                                        $('textarea#secretnote').text(decryptedText).autogrow(); //.triggerHandler('change');
                                        

                                        if(data.offer_delete) {
                                            $('#delete-note').show();
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
                                $('.loading-error').text(response.status).show();
            
                                if(response.detail) {
                                    //probably an actual server error (symfony error in json?)
                                    $('.loading-error').text($('.loading-error').text() + ' - ' + response.detail).show();
                                }
            
                                if(response.destroyedOn) {
                                    $('.loading-error').text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                }
            
                            } catch(e) {
                                alert( error + ' : ' + xhr.responseText );
            
                                $('.loading-error').text('Unexpected response').show();
                            }
            
                            $('.loading-error').show();


                            gtag('event', '404-read-note', { 'event_category': 'notes', 'event_label': 'Error Reading Note; expired or doesnt exist' });
                            
                        })
                        .always(function() {
                            $('.loading-temporary').hide();
                        });;

                    });
                }); //captcha
            }

            loadData();

        })();

    });


    $('#container-note-create').each(function(){

        var savedNoteModal = new Modal(document.getElementById('createdNoteMdlDlg'), {backdrop: 'static'});

        
        // $('#create-a-new-note').on('click', function(e){
        //     e.preventDefault();
        //     //$('.saved-link-display').hide();
        //     $('.status-updates').hide();
        //     $('#create-form-controls').hide();
        //     $('#create-a-new-note').hide();

        // });

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
            var submitButton = $form.find('button[type="submit"]');

            var reCaptchaSiteKey = $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('value');

            

            submitButton.attr('disabled', true);
            $('#status-updates-text').text('[Local] Inspecting if you\'re a human (reCaptchaV3)...').show();
            $('.status-updates').removeClass('hidden');


            grecaptcha.ready(function() {
                grecaptcha.execute(reCaptchaSiteKey, {action: 'createNote'}).then(function(recaptchaToken) {

                    (async () => {

                        $('#status-updates-text').text('[Local] Creating key and calculating hash...').show();

                        var encryptingNoteApp = new SecureNote();
                        var key = encryptingNoteApp.getKey();
                        var keyHash = await encryptingNoteApp.getKeyHash();
        
                        var encryptionError = false;
        
                        var encryptedB65 = '';

                        $('#status-updates-text').text('[Local] Encrypting...').show();
                        
                        try {
                            encryptedB65 = await encryptingNoteApp.encrypt( $form.find('textarea[name="secretnote"]').val());
                        } catch (ex) {
                            submitButton.attr('disabled', false);
                            $('#status-updates-text').text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message).show();
                            return;
                        }
                                        
        
                        var data = {
                            encrypted: encryptedB65,
                            keyhash: keyHash,
                            destroyonread: $form.find('input[name="destroy-on-read"]').is(':checked') ? 1: 0,
                            ttl: $form.find('select[name="ttl"] option:selected').attr('value'),
                            allowdelete: $form.find('input[name="allow-delete"]').is(':checked') ? 1: 0,
                            recaptchaToken: recaptchaToken
                        };

        
                        $('#status-updates-text').text('Uploading encrypted data to server for storage...').show();
                        
                        gtag('event', 'create-note', { 'event_category': 'notes', 'event_label': 'Create Note' });

        
                        $.post(window.location.origin + window.location.pathname, data, function(data){
        

                            $('#status-updates-text').text('[Local] Creating shareable link...').show();
        
                            $('#saved-link').html('');
                            $('#saved-note-tips').html();

                            var a = $('<a />')
                                //.attr('target', '_blank')
                                .attr('href', data.link + '#' + key)
                                .text(data.link + '#' + key);

                            a.appendTo($('#saved-link'));

                            $('#saved-link-to-copy').val(data.link + '#' + key);
                            $('#saved-link-to-copy').attr('value', data.link + '#' + key);


                            var toolTipElement = $('<span />');
                            $('<div />').text('Copied Link!').appendTo(toolTipElement);

                            $('<div />').html('&#8729; Max TTL: ' + $form.find('select[name="ttl"] option:selected').text()).appendTo(toolTipElement);

                            if($form.find('input[name="destroy-on-read"]').is(':checked')) {
                                $('<div />').html('&#8729; Self-destructs').appendTo(toolTipElement);
                            }
                            
                            if($form.find('input[name="allow-delete"]').is(':checked')) {
                                $('<div />').html('&#8729; Manually deleteable').appendTo(toolTipElement);
                            }

                            $('.saved-link-display .tooltiptext-upon-copy').html(toolTipElement.html());


                            //other tips
                            $('#saved-note-tips').find('span').remove();
                            $('<span class="mb-md-1" />').html('<strong>Max TTL:</strong> ' + $form.find('select[name="ttl"] option:selected').text()).appendTo($('#saved-note-tips'));
                            $('<span class="mb-md-1" />').html('<strong>Self Destructs when Read:</strong> ' + ($form.find('input[name="destroy-on-read"]').is(':checked') ? 'yes' : 'no')).appendTo($('#saved-note-tips'));
                            $('<span class="mb-md-1" />').html('<strong>Manually Deletable:</strong> ' + ($form.find('input[name="allow-delete"]').is(':checked') ? 'yes' : 'no')).appendTo($('#saved-note-tips'));


                            savedNoteModal.show();

                            $form[0].reset();
                            submitButton.attr('disabled', false);


                            $('.status-updates').addClass('hidden');
                            $('#status-updates-text').text('');
                            //$('.saved-link-display').show();
                            //$('#create-form-controls').hide();
                            //$('#create-a-new-note').show();

                
                        }, "json")
                        .fail(function(xhr, status, error) {
                
                            try {
                                var response = JSON.parse(xhr.responseText);
                                $('#status-updates-text').text(response.status).show();
                            } catch(e) {
                                $('#status-updates-text').text('Unexpected response from server').show();
                            }

                            submitButton.attr('disabled', false);
                                
                        });
        
                    })();


                });;
            });

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


$('button.cpy-from').each(function(){

    var _this = $(this);

    _this.on('click', function(e){
        e.preventDefault();
        var inputPath = $($(this).data('inputpath'));
        var tooltip = $(this).find('.tooltiptext').first();    
        var tooltipHTMLAfterCopy = $(this).find('.tooltiptext-upon-copy').first().html();
        var copyText = inputPath[0]; //document.getElementById("myInput");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        
        //var tooltip = document.getElementById("myTooltip");
        tooltip.html(tooltipHTMLAfterCopy);
    });

    _this.on('mouseout', function(e){
        //var tooltip = document.getElementById("myTooltip");
        var tooltip = $(this).find('.tooltiptext').first();
        tooltip.html("Copy Link to clipboard");
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


