<?php

namespace App\Service;
use Symfony\Component\HttpFoundation\Request;

class Cron
{
    public static function startCron($cronKey, Request $request) 
    {
        $httpHost = $request->server->get('HTTP_HOST');

        $URL = "https://{$httpHost}/cron/{$cronKey}";


        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $URL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        

        // $output contains the output string
        $output = curl_exec($ch);
        curl_close($ch); 

        return true;
    }
}