require('bootstrap');

import $ from 'jquery';
import SecureNote from './noteApp.js';
import moment from 'moment';

export default class ViewNoteUI {

    constructor(options) {

        var defaults = {
            containerPath: '#container-note-view',
            loadingTemporary: '.loading-temporary',
            statusUpdateTextPath: '#status-updates-text',
            confirmDestroyButtonPath: '#confirm-destroy',
            confirmCancelPath: '#confirm-cancel',
            reCaptchaSiteKey: $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('content'),
            secretNoteGroupPath: '.secretnote-group',
            secretNoteTextareaPath: 'textarea#secretnote',
            loadingErrorPath: '.loading-error',
            alertConfirmationRequiredPath: '.alert-warning.confirmation-required',
            deleteNoteButtonPath: '#delete-note',
            postURL: window.location.origin + window.location.pathname,
            postDeleteURL: window.location.origin + '/delete' + window.location.pathname

        };

        if(typeof options !== 'object') {
            options = {};
        }

        this.settings = $.extend({}, defaults, options);
    }

    bind() {


        var appUI = this;
        
        $(appUI.settings.containerPath).each(function(){

            (async () => {
            
                //calculate a hash on the key (the location hash), and request encrypted data from the
                //server by sending GUID and the keyHash - if both do not match we'll not get any data back.
    
                var urlHash = (window.location.hash).replace('#', '');
                var decryptingNoteApp = new SecureNote(urlHash); 
    
                $(appUI.settings.statusUpdateTextPath).text('[Local] Creating key and calculating hash...').show();
    
                var keyHash = await decryptingNoteApp.getKeyHash();
    
                $(window).on('hashchange', function() {
                    (async () => {
                        urlHash = (window.location.hash).replace('#', '');
                        decryptingNoteApp.setKey(urlHash); 
                        $(appUI.settings.loadingTemporary).show();
                        $(appUI.settings.statusUpdateTextPath).text('[Local] Creating key and calculating hash...').show();
                        keyHash = await decryptingNoteApp.getKeyHash();
    
                        loadData();
                    })();
                });
    
                
                $(appUI.settings.confirmDestroyButtonPath).on('click', function(){
    
                    $(appUI.settings.loadingTemporary).show();
    
                    var reCaptchaSiteKey = appUI.settings.reCaptchaSiteKey;
    
                    grecaptcha.ready(function() {
                        $(appUI.settings.statusUpdateTextPath).text('[Local] Inspecting if you\'re a human (reCaptchaV3)...').show();
                        grecaptcha.execute(reCaptchaSiteKey, {action: 'readNote'}).then(function(recaptchaToken) { 
                            $(appUI.settings.statusUpdateTextPath).text('Asking server for encrypted note...').show();
                            $.post(appUI.settings.postURL, {keyHash: keyHash, confirmDestroy: '1', recaptchaToken: recaptchaToken}, function(data){
                                //decrypt and show
                                (async () => {
    
                                    try {
                                        
                                        $(appUI.settings.statusUpdateTextPath).text('[Local] Decrypting note...').show();
                                        var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                                        
                                        $(appUI.settings.secretNoteGroupPath).show();
                                        $(appUI.settings.secretNoteTextareaPath).show().text(decryptedText).autogrow(); 
    
                                        $(appUI.settings.loadingErrorPath).text("The note is now destroyed. Make sure to copy it before you leave this page, it's gone forever.").show();
                                        $(appUI.settings.alertConfirmationRequiredPath).hide();
    
                                        if(data.offer_delete) {
                                            $(appUI.settings.deleteNoteButtonPath).fadeIn('fast');
                                        }                                    
    
                                        gtag('event', 'confirm-destroy-note', { 'event_category': 'notes', 'event_label': 'Read and Destroy' });
    
                                    } catch (ex) {
                                        $(appUI.settings.loadingErrorPath).text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                                        $(appUI.settings.loadingErrorPath).show();
                                    }
    
                                })();
                            }, "json")
                            .fail(function(xhr, status, error) {
                
                                try {
    
                                    var response = JSON.parse(xhr.responseText);
                                    $(appUI.settings.loadingErrorPath).text(response.status).show();
                
                                    if(response.detail) {
                                        //probably an actual server error (symfony error in json?)
                                        $(appUI.settings.loadingErrorPath).text($(appUI.settings.loadingErrorPath).text() + ' - ' + response.detail).show();
                                    }
                
                                    if(response.destroyedOn) {
                                        $(appUI.settings.loadingErrorPath).text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                    }
                
                                } catch(e) {
                                    alert( error + ' : ' + xhr.responseText );
                                    $(appUI.settings.loadingErrorPath).text('Unexpected response').show();
                                }
                
                                $(appUI.settings.loadingErrorPath).show();
                                
                            })
                            .always(function() {
                                $(appUI.settings.loadingTemporary).hide();
                            });;
    
                        });
                    }); //captcha
                });
    
                $(appUI.settings.confirmCancelPath).on('click', function(){
                    window.location = '/';
                });
    
                $(appUI.settings.deleteNoteButtonPath).on('click', function(){
                    
                    $(appUI.settings.loadingTemporary).show();
    
                    var reCaptchaSiteKey = appUI.settings.reCaptchaSiteKey;
                    grecaptcha.ready(function() {
                        $(appUI.settings.statusUpdateTextPath).text('[Local] Inspecting if you\'re a human (reCaptchaV3)...').show();
                        grecaptcha.execute(reCaptchaSiteKey, {action: 'deleteNote'}).then(function(recaptchaToken) { 
                            $(appUI.settings.statusUpdateTextPath).text('Deleting Note from Server').show();
                            $.post(appUI.settings.postDeleteURL, {keyHash: keyHash, confirmDestroy: '1', recaptchaToken: recaptchaToken}, function(data){
                                //manually delete
    
                                if(data.destroyed) {
                                    $(appUI.settings.loadingErrorPath).text("The note was deleted. Make sure to copy it before you leave this page, it's gone forever.").show();
                                } else {
                                    $(appUI.settings.loadingErrorPath).text("The note was probably deleted; there may have been an error. There was an unexpected response from the server, but no error info.").show();
                                }
    
                                $(appUI.settings.deleteNoteButtonPath).fadeOut();
    
                                gtag('event', 'manual-destroy-note', { 'event_category': 'notes', 'event_label': 'Manual Delete' });
    
                            
                            }, "json")
                            .fail(function(xhr, status, error) {
                
                                try {
                                    var response = JSON.parse(xhr.responseText);
                                    $(appUI.settings.loadingErrorPath).text(response.status).show();
                
                                    if(response.detail) {
                                        //probably an actual server error (symfony error in json?)
                                        $(appUI.settings.loadingErrorPath).text($(appUI.settings.loadingErrorPath).text() + ' - ' + response.detail).show();
                                    }
                
                                    if(response.destroyedOn) {
                                        $(appUI.settings.loadingErrorPath).text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                    }
                
                                } catch(e) {
                                    alert( error + ' : ' + xhr.responseText );
                
                                    $(appUI.settings.loadingErrorPath).text('Unexpected response').show();
                                }
                
                                $(appUI.settings.loadingErrorPath).show();
                                
                            })
                            .always(function() {
                                $(appUI.settings.loadingTemporary).hide();
                            });;
                        });
                    }); //captcha
    
                });
    
                function loadData() {
    
                    $(appUI.settings.loadingErrorPath).hide();
                    $(appUI.settings.alertConfirmationRequiredPath).hide();
                    $(appUI.settings.loadingTemporary).show();
                    $(appUI.settings.secretNoteTextareaPath).text('').autogrow();
                
                    var reCaptchaSiteKey = appUI.settings.reCaptchaSiteKey;
                
                    grecaptcha.ready(function() {
                        $(appUI.settings.statusUpdateTextPath).text('[Local] Inspecting if you\'re a human (reCaptchaV3)...').show();
                        grecaptcha.execute(reCaptchaSiteKey, {action: 'readNote'}).then(function(recaptchaToken) { 
                            $(appUI.settings.statusUpdateTextPath).text('Asking server for encrypted note...').show();
                            $.post(appUI.settings.postURL, {keyHash: keyHash, recaptchaToken: recaptchaToken}, function(data){
                
                                if(data.was_deleted) {
                                    $(appUI.settings.loadingErrorPath).text('This note has just self destructed... To die, to sleep, No more...').show();
                                } else if(data.expires) {
                                    $(appUI.settings.loadingErrorPath).text('This note will expire ' + moment(data.expires).from() + '.').show();
                                }
                
                                //if the note will self-destruct, we have to ask for confirmation first
                                if(data.confirmDestroy) {

                
                                    $(appUI.settings.alertConfirmationRequiredPath).show();
                                    $(appUI.settings.deleteNoteButtonPath).hide();
                
                                } else {
                
                                    gtag('event', 'read-note', { 'event_category': 'notes', 'event_label': 'Read Note' });
                
                                    (async () => {
                                        //decrypt and show
                                        try {
                                            $(appUI.settings.statusUpdateTextPath).text('[Local] Decrypting note...').show();
                                            var decryptedText = await decryptingNoteApp.decrypt(data.encrypted);
                                            $(appUI.settings.secretNoteGroupPath).show();
                                            $(appUI.settings.secretNoteTextareaPath).text(decryptedText).autogrow();                       
                
                                            if(data.offer_delete) {
                                                $(appUI.settings.deleteNoteButtonPath).show();
                                            }
                
                                        } catch (ex) {
                                            $(appUI.settings.loadingErrorPath).text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message);
                                            $(appUI.settings.loadingErrorPath).show();
                                        }
                                    })();
                                    
                                }
                
                            }, "json")
                            .fail(function(xhr, status, error) {
                
                                try {
                                    var response = JSON.parse(xhr.responseText);
                                    $(appUI.settings.loadingErrorPath).text(response.status).show();
                
                                    if(response.detail) {
                                        //probably an actual server error (symfony error in json?)
                                        $(appUI.settings.loadingErrorPath).text($(appUI.settings.loadingErrorPath).text() + ' - ' + response.detail).show();
                                    }
                
                                    if(response.destroyedOn) {
                                        $(appUI.settings.loadingErrorPath).text('The note was destroyed ' + moment(response.destroyedOn).from() + '.').show();
                                    }
                
                                } catch(e) {
                                    alert( error + ' : ' + xhr.responseText );
                
                                    $(appUI.settings.loadingErrorPath).text('Unexpected response').show();
                                }
                
                                $(appUI.settings.loadingErrorPath).show();
                
                
                                gtag('event', '404-read-note', { 'event_category': 'notes', 'event_label': 'Error Reading Note; expired or doesnt exist' });
                                
                            })
                            .always(function() {
                                $(appUI.settings.loadingTemporary).hide();
                            });;
                
                        });
                    }); //captcha
                }

    
                loadData();
    
            })();
    
        });
    }

   
}
