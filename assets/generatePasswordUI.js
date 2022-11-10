require('bootstrap');
import $ from 'jquery';
import PasswordGenerator from './passwordApp.js';
import NumberToWords from './numberToWords.js';

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
            charsetAlphaUpper:           'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            charsetAlphaUpperExcAmbig:  'ABCDEFGHJKMNPQRSTUVWXYZ',
            charsetAlphaLower:           'abcdefghijklmnopqrstuvwxyz',
            charsetAlphaLowerExcAmbig:  'abcdefghjkmnpqrstuvwxyz',
            charsetNumbers:             '0123456789',
            charsetNumbersExcAmbig:     '23456789',
            charsetSymbols:             '!@#$%^&*()_-+=~`{[}]\'";:.<>>,/?|\\',
            charsetSymbolsExcSpecials:  '!@#$%^&*()_-+=~`{[}];:.<>>,/?|',
            permWithRepeatCountVarN: '.perm-withrepeat-count-var-n',
            permWithRepeatCountVarR: '.perm-withrepeat-count-var-r',
            permWithRepeatCount: '#perm-withrepeat-count',        
            strengthCheckPath: '.strength-display-real, #password-length, #generated-password, .password-information',
            badStrengthClassname: 'strength-bad',
            okayStrengthClassname: 'strength-okay',
            goodStrengthClassname: 'strength-good',
            permLengthDescriptionPath: '#perm-withrepeat-count',
            numToWordsPath: '#num-to-words > code',
            copyPasswordButtonPath: '#copy-generated-password',
            timingOptionComputersPath: '#password-timing-option-computers',
            timingOptionPPSPath: '#password-timing-option-passpersecond',
            timingResultsMilleniaPath: '#password-timing-millenia',
            timingResultsYearsPath: '#password-timing-years',
            timingResultsMonthsPath: '#password-timing-months',
            timingResultsDaysPath: '#password-timing-days',
            timingResultsHoursPath: '#password-timing-hours',
            timingResultsMinutesPath: '#password-timing-minutes',
            timingResultsSecondsPath: '#password-timing-seconds',
            hideLessThanYearTimingPath: '#hide-less-than-year-timing'

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
            var numToWord = new NumberToWords;
            var lengthDisplay = $(appUI.settings.passwordLengthDisplayPath);
            var refreshButton = $(appUI.settings.refreshPasswordPath);
            var charset = '';
            var length = $(appUI.settings.passwordLengthPath).val();
    
            var generatePassword = function(){
                charset = '';
                length = $(appUI.settings.passwordLengthPath).val();
    
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
                        charset += appUI.settings.charsetAlphaUpper;
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
                    $(appUI.settings.permWithRepeatCountVarR).text(length);
                    $(appUI.settings.permWithRepeatCount).text(passGenerator.countPermutationsWithRepeat(length, charset));

                    try {
                        $(appUI.settings.numToWordsPath).text(numToWord.getWords($(appUI.settings.permWithRepeatCount).text()) + ' possible permutations.');
                    } catch(e) {
                        $(appUI.settings.numToWordsPath).text('');
                    }

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

                    $(appUI.settings.permWithRepeatCount).html($(appUI.settings.permWithRepeatCount).text().replace(/,/g, ',<wbr />'));                
                    $(appUI.settings.permLengthDescriptionPath).addClass(lengthDescription);
                    

                } catch (e) {
                    $(appUI.settings.permWithRepeatCount).text('?');
                }

                try {

                    var computers = (($(appUI.settings.timingOptionComputersPath).val()).replace(/[^0-9]+/g, ''));
                    var pps = (($(appUI.settings.timingOptionPPSPath).val()).replace(/[^0-9]+/g, ''));
                    var timingData = passGenerator.timeToBruteforce(length, charset, computers, pps);

                    $(appUI.settings.timingResultsYearsPath).text(timingData.years);
                    $(appUI.settings.timingResultsMonthsPath).text(timingData.months);
                    $(appUI.settings.timingResultsDaysPath).text(timingData.days);
                    $(appUI.settings.timingResultsHoursPath).text(timingData.hours);
                    $(appUI.settings.timingResultsMinutesPath).text(timingData.minutes);
                    $(appUI.settings.timingResultsSecondsPath).text(timingData.seconds);

                    if(timingData.hideLessThanYear) {
                        $(appUI.settings.hideLessThanYearTimingPath).hide();
                    } else {
                        $(appUI.settings.hideLessThanYearTimingPath).show();
                    }
                    
                } catch (e) {
                    console.log(e);
                }
                
            };
    
            $(appUI.settings.passwordLengthPath).on('input', function(){
                lengthDisplay.text($(this).val());
                generatePassword();
            });
    
            $(`${appUI.settings.includeUpperAlphaPath}, ${appUI.settings.includeLowerAlphaPath}, ${appUI.settings.includeNumbersPath}, ${appUI.settings.includeSymbolsPath}, ${appUI.settings.excludeSpecialsPath}, ${appUI.settings.excludeAmbigiousPath}`).on('input', function(){
                generatePassword();
            });

            $(`${appUI.settings.timingOptionComputersPath}, ${appUI.settings.timingOptionPPSPath}`).on('input', function(){
                var computers = (($(appUI.settings.timingOptionComputersPath).val()).replace(/[^0-9]+/g, ''));
                var pps = (($(appUI.settings.timingOptionPPSPath).val()).replace(/[^0-9]+/g, ''));

                if(computers < 1) {
                    computers = 1;
                    $(appUI.settings.timingOptionComputersPath).val(1);
                }

                if(pps < 1) {
                    pps = 1;
                    $(appUI.settings.timingOptionPPSPath).val(1);
                }

                var timingData = passGenerator.timeToBruteforce(length, charset, computers, pps);
                
                $(appUI.settings.timingResultsYearsPath).text(timingData.years);
                $(appUI.settings.timingResultsMonthsPath).text(timingData.months);
                $(appUI.settings.timingResultsDaysPath).text(timingData.days);
                $(appUI.settings.timingResultsHoursPath).text(timingData.hours);
                $(appUI.settings.timingResultsMinutesPath).text(timingData.minutes);
                $(appUI.settings.timingResultsSecondsPath).text(timingData.seconds);

                if(timingData.hideLessThanYear) {
                    $(appUI.settings.hideLessThanYearTimingPath).hide();
                } else {
                    $(appUI.settings.hideLessThanYearTimingPath).show();
                }
            });

          
    
            refreshButton.on('click', function(e){
                e.preventDefault();
                generatePassword();

                try {
                    gtag('event', 'refresh-password', { 'event_category': 'passwords', 'event_label': 'Refresh Generated Password' });
                }
                catch(e) {

                }
            });
    
            $(appUI.settings.passwordLengthPath).trigger('input');

            $(appUI.settings.copyPasswordButtonPath).on('click', function(){

                try {
                    gtag('event', 'copy-password', { 'event_category': 'passwords', 'event_label': 'Copy Generated Password' });
                }
                catch(e) {
    
                }

            });

           
            
        });

    }

   
}