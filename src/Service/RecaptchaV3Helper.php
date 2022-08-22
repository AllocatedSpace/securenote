<?php

namespace App\Service;

class RecaptchaV3Helper
{

    public static function getErrorDescriptions(Array $codes): Array
    {
        $descriptions = array();
        $legend = array(
            'invalid-json' => 'reCaptchaV3: Invalid JSON received',
            'connection-failed' => 'reCaptchaV3: Could not connect to service',
            'bad-response' => 'reCaptchaV3: Did not receive a 200 from the service',
            'unknown-error' => 'reCaptchaV3: Not a success, but no error codes received!',
            'missing-input-response' => 'reCaptchaV3: ReCAPTCHA response not provided',
            'hostname-mismatch' => 'reCaptchaV3: Expected hostname did not match',
            'apk_package_name-mismatch' => 'reCaptchaV3: Expected APK package name did not match',
            'action-mismatch' => 'reCaptchaV3: Expected action did not match',
            'score-threshold-not-met' => 'reCaptchaV3: Score threshold not met',
            'challenge-timeout' => 'reCaptchaV3: Challenge timeout'
        );

        foreach($codes as $code)
        {
            if(isset($legend[$code]))
            {
                $descriptions[] = $legend[$code];
            }
            else
            {
                $descriptions[] = "Unknown error: {$code}";
            }
        }

        return $descriptions;
    }

}