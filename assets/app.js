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