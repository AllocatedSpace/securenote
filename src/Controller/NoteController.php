<?php

// src/Controller/LuckyController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\Note;
use App\Service\SaferCrypto;
// ...

class NoteController extends AbstractController
{

    public function test(): Response
    {
        $guid = $this->uniqidReal();
        $key = $this->uniqidReal();


        $message = 'Lorem ipsum solar dot et!';
        $key = $key; //hex2bin('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');

        $encrypted = SaferCrypto::encrypt($message, $key);
        $decrypted = SaferCrypto::decrypt($encrypted, $key);
        try {
            $decryptedFail = SaferCrypto::decrypt($encrypted, $key . "asaaa");
        }
        catch(\Exception $e)
        {
            if($e->getMessage() == 'Encryption failure')
            {
                $decryptedFail = 'bad key';
            }
        }

        //var_dump($encrypted, $decrypted);

        return $this->render('note/test.html.twig', [
            'guid' => $guid,
            'key' => $key,
            'encrypted' => $encrypted,
            'decrypted' => $decrypted,
            'decryptedFail' => $decryptedFail
        ]);
    }


    public function create(ManagerRegistry $doctrine): Response
    {
        $guid = $this->uniqidReal();
        $key = $this->uniqidReal();


        $message = 'Lorem ipsum solar dot et!';
        $key = $key; //hex2bin('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');

        $encrypted = SaferCrypto::encrypt($message, $key);
        $decrypted = SaferCrypto::decrypt($encrypted, $key);

        //var_dump($encrypted, $decrypted);

        $entityManager = $doctrine->getManager();

        $product = new Note();
        $product->setGuid($guid);
        $product->setEncrypted($encrypted);
        $product->setDestroyOnRead(true);
        $expire = new DateTime(); //7 days
        $expire->add(DateInterval::createFromDateString('7 day'));
        $product->setExpire($expire);


        $entityManager->persist($product);

        $entityManager->flush();

        //return new Response('Saved new product with id '.$product->getId());

        return $this->render('note/test.html.twig', [
            'guid' => $guid,
            'key' => $key,
            'encrypted' => $encrypted,
            'decrypted' => $decrypted,
        ]);
    }


    public function read(ManagerRegistry $doctrine, string $guid): Response
    {
        $guid = $this->uniqidReal();
        $key = $this->uniqidReal();


        $message = 'Lorem ipsum solar dot et!';
        $key = $key; //hex2bin('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');

        $encrypted = SaferCrypto::encrypt($message, $key);
        $decrypted = SaferCrypto::decrypt($encrypted, $key);
        

        //var_dump($encrypted, $decrypted);

        $entityManager = $doctrine->getManager();

        $product = new Note();
        $product->setGuid($guid);
        $product->setEncrypted($encrypted);
        $product->setDestroyOnRead(true);
        $expire = new DateTime(); //7 days
        $expire->add(DateInterval::createFromDateString('7 day'));
        $product->setExpire($expire);


        $entityManager->persist($product);

        $entityManager->flush();

        //return new Response('Saved new product with id '.$product->getId());

        return $this->render('note/test.html.twig', [
            'guid' => $guid,
            'key' => $key,
            'encrypted' => $encrypted,
            'decrypted' => $decrypted,
        ]);
    }

    


    private function uniqidReal($length = 26) 
    {
        // uniqid gives 13 chars, but you could adjust it to your needs.
        if (function_exists("random_bytes")) 
        {
            $bytes = random_bytes(ceil($length / 2));
        } 
        elseif (function_exists("openssl_random_pseudo_bytes")) 
        {
            $bytes = openssl_random_pseudo_bytes(ceil($length / 2));
        } 
        else 
        {
            throw new Exception("no cryptographically secure random function available");
        }

        return substr(bin2hex($bytes), 0, $length);
    }
}