require('bootstrap');

import $ from 'jquery';


export default class UISettings {

    constructor(options) {

        var defaults = {
            themeSwitchPath: '#theme-switch',
            memorablePath: '.remember-value',
            memorableSettingKeyPrefix: (window.location.pathname).replace(/[^\/a-z]+/g, '')
        };

        if(typeof options !== 'object') {
            options = {};
        }

        this.settings = $.extend({}, defaults, options);
    }

    bindRememberance() {


        var appUI = this;

        try {

            var theme = 'light';
            theme = window.getTheme();
        
            if(theme == 'light') {
                $(appUI.settings.themeSwitchPath).attr('checked', 'checked'); 
            }
    
            $(appUI.settings.themeSwitchPath).on('input change', function(){
                var theme = $(this).is(':checked') ? 'light' : 'dark';
                localStorage.setItem('theme', theme);
                document.documentElement.setAttribute('data-theme', theme);
            });

        } catch (e) {
            
        }
        
        $(appUI.settings.memorablePath).each(function(){

            try {
                var _this = $(this);

                console.log(_this.attr('id'));

                if(!_this.attr('id')) {
                    return;
                }

                var settingName = appUI.settings.memorableSettingKeyPrefix + '/' +  _this.attr('id');
                var storedValue = localStorage.getItem(settingName); // either the OPTION VALUE if SELECT, or "checked" or "unchecked" if radio/check, or number if range/number
                var elementType = _this.prop('nodeName').toLowerCase();

                

                if(elementType == 'input') {
                    var inputType = _this.attr('type');

                    console.log(inputType);

                    if(inputType == 'checkbox' || inputType == 'radio') {

                        if(storedValue == 'checked') {
                            _this.prop('checked', true).trigger('change');;
                        } else if(storedValue == 'unchecked') {
                            _this.prop('checked', false).trigger('change');;
                        }

                        _this.on('change', function(){
                            localStorage.setItem(settingName, $(this).is(':checked') ? 'checked' : 'unchecked');
                        });


                    } else if (inputType == 'range' || inputType == 'number') {

                        if(storedValue !== null) {
                            _this.val(storedValue).trigger('change');;
                        }

                        _this.on('change', function(){
                            localStorage.setItem(settingName, $(this).val());
                        });

                    }

                } else if(elementType == 'select') {

                    if(storedValue !== null) {
                        _this.val(storedValue).trigger('change');
                    }

                    _this.on('change', function(){
                        localStorage.setItem(settingName, $(this).find('option:selected').val());
                    });

                }



            } catch (e) {
                //no recovery
            }

        });
    }

   
}
