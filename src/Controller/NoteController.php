<?php

// src/Controller/LuckyController.php
namespace App\Controller;

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
            'encrypted' => $encrypted,
            'decrypted' => $decrypted,
            'decryptedFail' => $decryptedFail
        ]);
    }

    public function view(): Response
    {
        return $this->render('note/view.html.twig', [
           
        ]);
    }



    public function create(ManagerRegistry $doctrine, Request $request): JsonResponse
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
        $note->setEncrypted($encrypted);
        $note->setDestroyOnRead($destroyOnRead);

        $expire = new DateTime(); 
        $expire->add(DateInterval::createFromDateString($daysToLive . ' day'));
        $note->setExpire($expire);

        $entityManager->persist($note);
        $entityManager->flush();


        $httpHost = $request->server->get('HTTP_HOST');

        return $this->json([
            'link' => "https://{$httpHost}/{$guid}#{$key}",
        ]);
    }


    public function read(ManagerRegistry $doctrine, Request $request, string $guid): JsonResponse
    {

        $key = $request->request->get('hash'); //POST

        if(!$request->isXmlHttpRequest() || !preg_match('~^[a-z0-9]{26}$~', $key) || !!preg_match('~^[a-z0-9]{26}$~', $guid))
        {
            return $this->json([
                'status' => 'Bad Request'
            ], $status = 400);
        }        

        $note = $doctrine->getRepository(Note::class)->findOneByGuid($guid);
        
        if(!$note)
        {
            return $this->json([
                'status' => 'Note doesn\'t exist or has expired.'
            ], $status = 404);
        }

       
        $decrypted = '';

        try {
            $decrypted = SaferCrypto::decrypt($note->getEncrypted(), $key);
        }
        catch(\Exception $e)
        {
            if($e->getMessage() == 'Encryption failure')
            {
                //bad key;
                return $this->json([
                    'status' => 'Note doesn\'t exist or has expired.'
                ], $status = 404);
            }
        }

        $deleteOnRead = $note->isDestroyOnRead();
        if($deleteOnRead)
        {
            $entityManager = $doctrine->getManager();
            $entityManager->remove($note);
            $entityManager->flush();
        }

        return $this->json([
            'decrypted' => $decrypted,
            'was_deleted' => $deleteOnRead
        ]);
        
    }


}