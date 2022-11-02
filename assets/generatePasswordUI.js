require('bootstrap');
import $ from 'jquery';
import PasswordGenerator from './passwordApp.js';

export default class GeneratePasswordUI {

    constructor(options) {

        var defaults = {
            containerPath: '#container-generate-password',
            passwordLengthDisplayPath: '#password-length-display',
            refreshPasswordPath: '#refresh-password',
            passwordLengthPath: '#password-length',
            excludeAmbigiousPath: '#exc-ambig',
            excludeSpecialsPath: '#exc-specials',
            includeUpperAlphaPath: '#inc-upper-alpha',
            includeLowerAlphaPath: '#inc-lower-alpha',
            includeNumbersPath: '#inc-numbers',
            includeSymbolsPath: '#inc-symbols',
            generatedPasswordPath: '#generated-password',
            charsetAlphUpper:           'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            charsetAlphaUpperExcAmbig:  'ABCDEFGHJKMNPQRSTUVWXYZ',
            charsetAlphLower:           'abcdefghijklmnopqrstuvwxyz',
            charsetAlphaLowerExcAmbig:  'abcdefghjkmnpqrstuvwxyz',
            charsetNumbers:             '0123456789',
            charsetNumbersExcAmbig:     '23456789',
            charsetSymbols:             '!@#$%^&*()_-+=~`{[}]\'";:.<>>,/?|\\',
            charsetSymbolsExcSpecials:  '!@#$%^&*()_-+=~`{[}];:.<>>,/?|',
        };

        if(typeof options !== 'object') {
            options = {};
        }

        this.settings = $.extend({}, defaults, options);
    }

    bind() {

        var appUI = this;
        
        $(appUI.settings.containerPath).each(function(){

            var passGenerator = new PasswordGenerator();
            var lengthDisplay = $(appUI.settings.passwordLengthDisplayPath);
            var refreshButton = $(appUI.settings.refreshPasswordPath);
    
            var generatePassword = function(){
                var charset = '';
                var length = $(appUI.settings.passwordLengthPath).val();
    
                if(length <= 0) {
                    length = 4;
                }
    
                var excludeAmbigious = $(appUI.settings.excludeAmbigiousPath).is(':checked');
                var excludeSpecials = $(appUI.settings.excludeSpecialsPath).is(':checked');
    
                if($(appUI.settings.includeUpperAlphaPath).is(':checked')) {
                    if(excludeAmbigious) {
                        charset += appUI.settings.charsetAlphaUpperExcAmbig;
                    } else {
                        charset += appUI.settings.charsetAlphUpper;
                    }
                    
                }
    
                if($(appUI.settings.includeLowerAlphaPath).is(':checked')) {
                   
                    if(excludeAmbigious) {
                        charset += appUI.settings.charsetAlphaLowerExcAmbig;
                    } else {
                        charset += appUI.settings.charsetAlphaLower;
                    }
                }
    
                if($(appUI.settings.includeNumbersPath).is(':checked')) {
    
                    if(excludeAmbigious) {
                        charset += appUI.settings.charsetNumbersExcAmbig;
                    } else {
                        charset += appUI.settings.charsetNumbers;
                    }
                }
    
                if($(appUI.settings.includeSymbolsPath).is(':checked')) {
                    if(excludeSpecials) {
                        charset += appUI.settings.charsetSymbolsExcSpecials;
                    } else {
                        charset += appUI.settings.charsetSymbols;
                    }
                }
    
                if(charset.length == 0) {
                    $(appUI.settings.generatedPasswordPath).val('select atleast one character set option :)');
                    return;
                }
    
                $(appUI.settings.generatedPasswordPath).val(passGenerator.getPassword(length, charset));
            };
    
            $(appUI.settings.passwordLengthPath).on('input', function(){
                lengthDisplay.text($(this).val());
                generatePassword();
            });
    
            $(`${appUI.settings.includeUpperAlphaPath}, ${appUI.settings.includeLowerAlphaPath}, ${appUI.settings.includeNumbersPath}, ${appUI.settings.includeSymbolsPath}, ${appUI.settings.excludeSpecialsPath}, ${appUI.settings.excludeAmbigiousPath}`).on('input', function(){
                generatePassword();
            });
    
            refreshButton.on('click', function(e){
               e.preventDefault();
               generatePassword();
            });
    
            $(appUI.settings.passwordLengthPath).trigger('input');
            
        });

    }

   
}