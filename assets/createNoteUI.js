require('bootstrap');
import { Modal } from 'bootstrap';
import $ from 'jquery';
import SecureNote from './noteApp.js';

export default class CreateNoteUI {

    constructor(options) {

        var defaults = {
            containerPath: '#container-note-create',
            dialogId: 'createdNoteMdlDlg',
            destroyOnReadPath: '#destroy-on-read',
            allowDeletePath: '#allow-delete',
            formPath: 'form#form-note-create',
            reCaptchaSiteKey: $('meta[name="GOOGLE_RECAPTCHA_SITE_KEY"]').attr('content'),
            statusUpdatesTextPath: '#status-updates-text',
            statusUpdatesPath: '.status-updates',
            savedLinkPath: '#saved-link',
            savedNoteTips: '#saved-note-tips',
            savedLinkToCopyPath: '#saved-link-to-copy',
            tooltipUponCopyPath: '.saved-link-display .tooltiptext-upon-copy',
            postURL: window.location.origin + window.location.pathname

        };

        if(typeof options !== 'object') {
            options = {};
        }

        this.settings = $.extend({}, defaults, options);
    }

    bind() {

        var appUI = this;
        
        $(appUI.settings.containerPath).each(function(){

            var savedNoteModal = new Modal(document.getElementById(appUI.settings.dialogId), {backdrop: 'static'});
    
            $(appUI.settings.destroyOnReadPath).on('change', function(){
                if($(this).is(':checked')) {
                    //copy original check of allow-delete
                    $(appUI.settings.allowDeletePath).data('checked-state', $(appUI.settings.allowDeletePath).is(':checked'));
                    $(appUI.settings.allowDeletePath).prop( "checked", false ).prop( "disabled", true );
                } else {
                    $(appUI.settings.allowDeletePath).prop( "checked", $(appUI.settings.allowDeletePath).data('checked-state') ).prop( "disabled", false );
                }
            });
    
            $(appUI.settings.destroyOnReadPath).trigger('change');
    
            $(appUI.settings.formPath).on('submit', function(e){
    
                e.preventDefault();
                var $form = $(this);
                var submitButton = $form.find('button[type="submit"]');
                var reCaptchaSiteKey = appUI.settings.reCaptchaSiteKey;           
    
                submitButton.attr('disabled', true);
                $(appUI.settings.statusUpdatesTextPath).text('[Local] Inspecting if you\'re a human (reCaptchaV3)...').show();
                $(appUI.settings.statusUpdatesPath).removeClass('hidden');
    
                grecaptcha.ready(function() {
                    grecaptcha.execute(reCaptchaSiteKey, {action: 'createNote'}).then(function(recaptchaToken) {
    
                        (async () => {
    
                            $(appUI.settings.statusUpdatesTextPath).text('[Local] Creating key and calculating hash...').show();
    
                            var encryptingNoteApp = new SecureNote();
                            var key = encryptingNoteApp.getKey();
                            var keyHash = await encryptingNoteApp.getKeyHash();        
                            var encryptedB65 = '';
    
                            $(appUI.settings.statusUpdatesTextPath).text('[Local] Encrypting...').show();
                            
                            try {
                                encryptedB65 = await encryptingNoteApp.encrypt( $form.find('textarea[name="secretnote"]').val());
                            } catch (ex) {
                                submitButton.attr('disabled', false);
                                $(appUI.settings.statusUpdatesTextPath).text("Error decrypting: Name: " + ex.name + ", Message: " + ex.message).show();
                                return;
                            }
            
                            var data = {
                                encrypted: encryptedB65,
                                keyhash: keyHash,
                                destroyonread: $form.find(appUI.settings.destroyOnReadPath).is(':checked') ? 1: 0,
                                ttl: $form.find('select[name="ttl"] option:selected').attr('value'),
                                allowdelete: $form.find(appUI.settings.allowDeletePath).is(':checked') ? 1: 0,
                                recaptchaToken: recaptchaToken
                            };
    
                            $(appUI.settings.statusUpdatesTextPath).text('Uploading encrypted data to server for storage...').show();
                            gtag('event', 'create-note', { 'event_category': 'notes', 'event_label': 'Create Note' });
    
                            $.post(appUI.settings.postURL, data, function(data){
            
                                $(appUI.settings.statusUpdatesTextPath).text('[Local] Creating shareable link...').show();
            
                                $(appUI.settings.savedLinkPath).html('');
                                $(appUI.settings.savedNoteTips).html();
    
                                var a = $('<a />')
                                    .attr('href', data.link + '#' + key)
                                    .text(data.link + '#' + key);
    
                                a.appendTo($(appUI.settings.savedLinkPath));
    
                                $(appUI.settings.savedLinkToCopyPath).val(data.link + '#' + key);
                                $(appUI.settings.savedLinkToCopyPath).attr('value', data.link + '#' + key);
    
                                var toolTipElement = $('<span />');
                                $('<div />').text('Copied Link!').appendTo(toolTipElement);
    
                                $('<div />').html('&#8729; Max TTL: ' + $form.find('select[name="ttl"] option:selected').text()).appendTo(toolTipElement);
    
                                if($form.find(appUI.settings.destroyOnReadPath).is(':checked')) {
                                    $('<div />').html('&#8729; Self-destructs').appendTo(toolTipElement);
                                }
                                
                                if($form.find(appUI.settings.allowDeletePath).is(':checked')) {
                                    $('<div />').html('&#8729; Manually deleteable').appendTo(toolTipElement);
                                }
    
                                $(appUI.settings.tooltipUponCopyPath).html(toolTipElement.html());
    
                                //other tips
                                $(appUI.settings.savedNoteTips).find('span').remove();
                                $('<span class="mb-md-1" />').html('<strong>Max TTL:</strong> ' + $form.find('select[name="ttl"] option:selected').text()).appendTo($(appUI.settings.savedNoteTips));
                                $('<span class="mb-md-1" />').html('<strong>Self Destructs when Read:</strong> ' + ($form.find(appUI.settings.destroyOnReadPath).is(':checked') ? 'yes' : 'no')).appendTo($(appUI.settings.savedNoteTips));
                                $('<span class="mb-md-1" />').html('<strong>Manually Deletable:</strong> ' + ($form.find(appUI.settings.allowDeletePath).is(':checked') ? 'yes' : 'no')).appendTo($(appUI.settings.savedNoteTips));
    
                                savedNoteModal.show();
    
                                $form[0].reset();
                                $(appUI.settings.destroyOnReadPath).trigger('change');
                                submitButton.attr('disabled', false);
                                $(appUI.settings.statusUpdatesTextPath).addClass('hidden');
                                $(appUI.settings.statusUpdatesTextPath).text('');
                    
                            }, "json")
                            .fail(function(xhr, status, error) {
                    
                                try {
                                    var response = JSON.parse(xhr.responseText);
                                    $(appUI.settings.statusUpdatesTextPath).text(response.status).show();
                                } catch(e) {
                                    $(appUI.settings.statusUpdatesTextPath).text('Unexpected response from server').show();
                                }
    
                                submitButton.attr('disabled', false);
                                    
                            });
            
                        })();
    
                    });;
                });
    
            });
        });
    }

   
}