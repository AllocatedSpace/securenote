require('bootstrap');

import './styles/themes.scss';
import './styles/layout.scss';
import './styles/app.scss';



import $ from 'jquery';

import CreateNoteUI from './createNoteUI.js';
import ViewNoteUI from './viewNoteUI.js';
import GeneratePasswordUI from './generatePasswordUI.js';
import UISettings from './settings.js';


$(function() {

    var settings = new UISettings({});
    settings.bindRememberance();
    
    var viewNoteUI = new ViewNoteUI({});
    viewNoteUI.bind();

    var createNoteUI = new CreateNoteUI({});
    createNoteUI.bind();

    var generatePasswordUI = new GeneratePasswordUI({});
    generatePasswordUI.bind();

    //test sandbox
    /*
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
    */
});

$('button.cpy-from').each(function(){

    var _this = $(this);

    var tooltip = $(this).find('.tooltiptext').first();
    var originalText = tooltip.html();

    _this.on('click', function(e){
        e.preventDefault();
        var inputPath = $($(this).data('inputpath'));  
        var tooltipHTMLAfterCopy = $(this).find('.tooltiptext-upon-copy').first().html();
        var copyText = inputPath[0]; 
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        tooltip.html(tooltipHTMLAfterCopy);
    });

    _this.on('mouseout', function(e){
        tooltip.html(originalText);
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


