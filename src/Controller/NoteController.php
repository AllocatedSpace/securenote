<?php

// src/Controller/LuckyController.php
namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\Note;
use App\Service\SaferCrypto;
use App\Service\NoteGUID;
// ...

class NoteController extends AbstractController
{

    public function test(): Response
    {
        $guid = NoteGUID::uniqidReal();
        $key = NoteGUID::uniqidReal();


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

        return $this->render('note/test.html.twig', [
            'guid' => $guid,
            'key' => $key,
            'encrypted' => base64_encode($encrypted),
            'decrypted' => $decrypted,
            'decryptedFail' => base64_encode($decryptedFail)
        ]);
    }

    public function view(): Response
    {
        return $this->render('note/view.html.twig', [
           
        ]);
    }


    public function createView(ManagerRegistry $doctrine, Request $request): Response
    {
        return $this->render('note/create.html.twig', [
           
        ]);
    }


    public function createSave(ManagerRegistry $doctrine, Request $request): JsonResponse
    {
        $guid = NoteGUID::uniqidReal();
        $key = NoteGUID::uniqidReal();

        $securenote = $request->request->get('securenote'); //POST
        $destroyOnRead = $request->request->get('destroyonread') == '1'; //POST
        $daysToLive = max(1, min(30, intval($request->request->get('daystolive')))); //1 - 30

        $encrypted = SaferCrypto::encrypt($securenote, $key);

        $entityManager = $doctrine->getManager();

        

        $note = new Note();
        $note->setGuid($guid);
        $note->setEncrypted(base64_encode($encrypted));
        $note->setDestroyOnRead($destroyOnRead);

        $expire = new \DateTime(); 
        $expire->add(\DateInterval::createFromDateString($daysToLive . ' day'));
        $note->setExpire($expire);

        $entityManager->persist($note);
        $entityManager->flush();


        $httpHost = $request->server->get('HTTP_HOST');

        return new JsonResponse([
            'link' => "https://{$httpHost}/n/{$guid}#{$key}",
        ]);
    }


    public function read(ManagerRegistry $doctrine, Request $request, string $guid): JsonResponse
    {

        $key = $request->request->get('hash'); //POST
        

        if(!$request->isXmlHttpRequest() || !preg_match('~^[a-z0-9]{26}$~', $key) || !preg_match('~^[a-z0-9]{26}$~', $guid))
        {
            return new JsonResponse([
                'status' => 'Bad Request'
            ], $status = 400);
        }        

        $note = $doctrine->getRepository(Note::class)->findOneByGuid($guid);
        
        if(!$note)
        {
            return new JsonResponse([
                'status' => 'Note doesn\'t exist or has expired.'
            ], $status = 404);
        }

        //die('the note?' . $note->getId() . '; the hash: ' . $key . '; the data: ' . $note->getEncrypted());

       
        $decrypted = '';

        try {
            
            $decrypted = SaferCrypto::decrypt(base64_decode(stream_get_contents($note->getEncrypted())), $key);

        }
        catch(\Exception $e)
        {
            if($e->getMessage() == 'Encryption failure')
            {
                //bad key;
                return new JsonResponse([
                    'status' => 'Note doesn\'t exist or has expired.'
                ], $status = 404);
            }
            else
            {
                return new JsonResponse([
                    'status' => $e->getMessage()
                ], $status = 500);
            }
        }

        $deleteOnRead = $note->isDestroyOnRead();
        if($deleteOnRead)
        {
            $entityManager = $doctrine->getManager();
            $entityManager->remove($note);
            $entityManager->flush();
        }

        return new JsonResponse([
            'decrypted' => $decrypted,
            'was_deleted' => $deleteOnRead
        ]);
        
    }


}