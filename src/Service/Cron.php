<?php

namespace App\Service;
use Symfony\Component\HttpFoundation\Request;

class Cron
{

    //CRON: */15 * * * * curl https://securenote.ca/cron/<CRONKEY> >/dev/null 2>&1
    public static function startCron($cronKey, Request $request) 
    {
        $httpHost = $request->server->get('HTTP_HOST');

        $URL = "https://{$httpHost}/cron/{$cronKey}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $URL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);

        $output = curl_exec($ch);
        curl_close($ch); 

        return true;
    }
}