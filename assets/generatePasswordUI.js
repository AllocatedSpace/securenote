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
            permWithRepeatCountVarN: '.perm-withrepeat-count-var-n',
            permWithRepeatCountVarR: '.perm-withrepeat-count-var-r',
            permWithRepeatCount: '#perm-withrepeat-count',
            permNoRepeatCountVarN: '.perm-norepeat-count-var-n',
            permNoRepeatCountVarR: '.perm-norepeat-count-var-r',
            permNoRepeatCount: '#perm-norepeat-count',
        
            strengthCheckPath: '.strength-display-real, #password-length, #generated-password',
            badStrengthClassname: 'strength-bad',
            okayStrengthClassname: 'strength-okay',
            goodStrengthClassname: 'strength-good',
            permLengthDescriptionPath: '#perm-withrepeat-count, #perm-norepeat-count'
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
                    length = 3;
                }


                $(appUI.settings.strengthCheckPath)
                    .removeClass(appUI.settings.badStrengthClassname)
                    .removeClass(appUI.settings.okayStrengthClassname)
                    .removeClass(appUI.settings.goodStrengthClassname);


                if(length < 6) {
                    $(appUI.settings.strengthCheckPath).addClass(appUI.settings.badStrengthClassname);
                }

                if(length >= 6 && length < 9) {
                    $(appUI.settings.strengthCheckPath).addClass(appUI.settings.okayStrengthClassname);
                }

                if(length >= 9) {
                    $(appUI.settings.strengthCheckPath).addClass(appUI.settings.goodStrengthClassname);
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

                var lengthClassnames = ['long', 'really-long', 'really-really-long', 'really-really-really-long'];
                var lengthDescription = '';

                for(var i = 0; i < lengthClassnames.length; i++) {
                    $(appUI.settings.permLengthDescriptionPath).removeClass(lengthClassnames[i]);
                }

                try {
                    $(appUI.settings.permWithRepeatCountVarN).text(charset.length);
                    $(appUI.settings.permNoRepeatCountVarN).text(charset.length);
                    $(appUI.settings.permWithRepeatCountVarR).text(length);
                    $(appUI.settings.permNoRepeatCountVarR).text(length);
                    $(appUI.settings.permWithRepeatCount).text(passGenerator.countPermutationsWithRepeat(length, charset));
                    $(appUI.settings.permNoRepeatCount).text(passGenerator.countPermutationsNoRpeat(length, charset));                    

                    if($(appUI.settings.permWithRepeatCount).text().length > 34) {
                        lengthDescription = lengthClassnames[0];
                    }

                    if($(appUI.settings.permWithRepeatCount).text().length > 44) {
                        lengthDescription =  lengthClassnames[1];
                    }

                    if($(appUI.settings.permWithRepeatCount).text().length > 54) {
                        lengthDescription =  lengthClassnames[2];
                    }

                    if($(appUI.settings.permWithRepeatCount).text().length > 64) {
                        lengthDescription =  lengthClassnames[3];
                    }

                    $(appUI.settings.permLengthDescriptionPath).addClass(lengthDescription);
                    

                } catch (e) {
                    $(appUI.settings.permWithRepeatCount).text('?');
                    $(appUI.settings.permNoRepeatCount).text('?');
                }
                
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