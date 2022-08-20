<?php

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

        $GOOGLE_RECAPTCHA_SITE_KEY = $this->getParameter('app.GOOGLE_RECAPTCHA_SITE_KEY');

        return $this->render('note/test.html.twig', [
            'guid' => $guid,
            'key' => $key,
            'encrypted' => base64_encode($encrypted),
            'decrypted' => $decrypted,
            'decryptedFail' => base64_encode($decryptedFail),
            'GOOGLE_RECAPTCHA_SITE_KEY' => $GOOGLE_RECAPTCHA_SITE_KEY
        ]);
    }

    public function viewIndex(): Response
    {
        $GOOGLE_RECAPTCHA_SITE_KEY = $this->getParameter('app.GOOGLE_RECAPTCHA_SITE_KEY');
        
        return $this->render('note/view.html.twig', [
           'GOOGLE_RECAPTCHA_SITE_KEY' => $GOOGLE_RECAPTCHA_SITE_KEY
        ]);
    }

    public function getNote(ManagerRegistry $doctrine, Request $request, string $guid): JsonResponse
    {

        $GOOGLE_RECAPTCHA_SECRET = $this->getParameter('app.GOOGLE_RECAPTCHA_SECRET');
        $recaptchaToken = $request->request->get('recaptchaToken'); 

        $recaptcha = new \ReCaptcha\ReCaptcha($GOOGLE_RECAPTCHA_SECRET);
        $resp = $recaptcha->setExpectedHostname($request->server->get('HTTP_HOST'))
                        ->setExpectedAction('readNote')
                        ->setScoreThreshold(0.5)
                        ->verify($recaptchaToken, 
                            $request->server->get('HTTP_CF_CONNECTING_IP') ? 
                            $request->server->get('HTTP_CF_CONNECTING_IP') : 
                            $request->server->get('REMOTE_ADDR'));

        if ($resp->isSuccess()) {
            // Verified!
        } else {
            $errors = $resp->getErrorCodes();
            return new JsonResponse([
                'status' => json_encode($errors)
            ], $status = 403);
        }
        // recaptcha


        $keyHash = $request->request->get('keyHash'); //POST
        $destroyOnReadConfirmed =  $request->request->get('confirmDestroy') == '1';
        

        if(!$request->isXmlHttpRequest() || !preg_match('~^[a-z0-9]{64}$~', $keyHash) || !preg_match('~^[a-z0-9]{26}$~', $guid))
        {
            return new JsonResponse([
                'status' => 'Bad Request'
            ], $status = 400);
        }        

        $note = $doctrine->getRepository(Note::class)->findOneByGuidAndKeyHash($guid, $keyHash);
        
        if(!$note)
        {
            return new JsonResponse([
                'status' => 'Note doesn\'t exist or has expired.'
            ], $status = 404);
        }


        //if destroyed, return so
        if($destroyedOn = $note->getDestroyed())
        {
            return new JsonResponse([
                'status' => 'The note was destroyed.',
                'destroyedOn' => $destroyedOn->format('c')
            ], $status = 404);
        }

        if($note->isDestroyOnRead() && !$destroyOnReadConfirmed)
        {
            //ask to confirm because it will delete after reading
            return new JsonResponse([
                'status' => false,
                'confirmDestroy' => true
            ], $status = 200);

        }


        //die('the note?' . $note->getId() . '; the hash: ' . $key . '; the data: ' . $note->getEncrypted());

        //we will just return the data. and whether or not it's been destroyed or will continue to live

        $encryptedData = stream_get_contents($note->getEncrypted());

        $deleteOnRead = $note->isDestroyOnRead();
        if($deleteOnRead)
        {
            $entityManager = $doctrine->getManager();
            //$entityManager->remove($note);
            $note->setEncrypted('');
            $note->setDestroyed(new \DateTime('now'));

            $entityManager->flush();
        }


        return new JsonResponse([
            'encrypted' => $encryptedData,
            'was_deleted' => $deleteOnRead,
            'expires' => $note->getExpire()->format('c'),
            'offer_delete' => $note->isAllowDelete() == true,
            'destroyed' => $note->getDestroyed() ? $note->getDestroyed()->format('c') : false
        ]);
        
    }

    public function deleteNote(ManagerRegistry $doctrine, Request $request, string $guid): JsonResponse
    {

        $GOOGLE_RECAPTCHA_SECRET = $this->getParameter('app.GOOGLE_RECAPTCHA_SECRET');
        $recaptchaToken = $request->request->get('recaptchaToken'); 

        $recaptcha = new \ReCaptcha\ReCaptcha($GOOGLE_RECAPTCHA_SECRET);
        $resp = $recaptcha->setExpectedHostname($request->server->get('HTTP_HOST'))
                        ->setExpectedAction('deleteNote')
                        ->setScoreThreshold(0.5)
                        ->verify($recaptchaToken, 
                            $request->server->get('HTTP_CF_CONNECTING_IP') ? 
                            $request->server->get('HTTP_CF_CONNECTING_IP') : 
                            $request->server->get('REMOTE_ADDR'));

        if ($resp->isSuccess()) {
            // Verified!
        } else {
            $errors = $resp->getErrorCodes();
            return new JsonResponse([
                'status' => json_encode($errors)
            ], $status = 403);
        }
        // recaptcha


        $keyHash = $request->request->get('keyHash'); //POST
        $confirmDestroy =  $request->request->get('confirmDestroy') == '1';
                

        if(!$confirmDestroy || !$request->isXmlHttpRequest() || !preg_match('~^[a-z0-9]{64}$~', $keyHash) || !preg_match('~^[a-z0-9]{26}$~', $guid))
        {
            return new JsonResponse([
                'status' => 'Bad Request'
            ], $status = 400);
        }        

        $note = $doctrine->getRepository(Note::class)->findOneByGuidAndKeyHash($guid, $keyHash);
        
        if(!$note)
        {
            return new JsonResponse([
                'status' => 'Note doesn\'t exist or has expired.'
            ], $status = 404);
        }


        //if destroyed, return so
        if($destroyedOn = $note->getDestroyed())
        {
            return new JsonResponse([
                'status' => 'The note was destroyed.',
                'destroyedOn' => $destroyedOn->format('c')
            ], $status = 404);
        }

        if(!$note->isAllowDelete())
        {
            return new JsonResponse([
                'status' => 'The note cannot be deleted manually.',
                'expires' => $note->getExpire()->format('c')
            ], $status = 404);
        }
        else
        {
            $entityManager = $doctrine->getManager();
            $note->setEncrypted('');
            $note->setDestroyed(new \DateTime('now'));
            $entityManager->flush();

            return new JsonResponse([
                'destroyed' => $note->getDestroyed() ? $note->getDestroyed()->format('c') : false
            ], $status = 200);

        }

        
    }


    public function createView(ManagerRegistry $doctrine, Request $request): Response
    {

        $GOOGLE_RECAPTCHA_SITE_KEY = $this->getParameter('app.GOOGLE_RECAPTCHA_SITE_KEY');
        
        return $this->render('note/create.html.twig', [
           'GOOGLE_RECAPTCHA_SITE_KEY' => $GOOGLE_RECAPTCHA_SITE_KEY
        ]);
    }

    //

    public function storeNote(ManagerRegistry $doctrine, Request $request): JsonResponse
    {


        $GOOGLE_RECAPTCHA_SECRET = $this->getParameter('app.GOOGLE_RECAPTCHA_SECRET');
        $recaptchaToken = $request->request->get('recaptchaToken'); 

        $recaptcha = new \ReCaptcha\ReCaptcha($GOOGLE_RECAPTCHA_SECRET);
        $resp = $recaptcha->setExpectedHostname($request->server->get('HTTP_HOST'))
                        ->setExpectedAction('createNote')
                        ->setScoreThreshold(0.5)
                        ->verify($recaptchaToken, 
                            $request->server->get('HTTP_CF_CONNECTING_IP') ? 
                            $request->server->get('HTTP_CF_CONNECTING_IP') : 
                            $request->server->get('REMOTE_ADDR'));

        if ($resp->isSuccess()) {
            // Verified!
        } else {
            $errors = $resp->getErrorCodes();
            return new JsonResponse([
                'status' => json_encode($errors)
            ], $status = 403);
        }
        // recaptcha


        $guid = NoteGUID::uniqidReal();

        $encrypted = $request->request->get('encrypted'); 
        $keyhash = $request->request->get('keyhash'); 
        $destroyOnRead = $request->request->get('destroyonread') == '1';
        $daysToLive = max(1, min(30, intval($request->request->get('daystolive')))); //1 - 30
        $allowDelete = $request->request->get('allowdelete') == '1'; 


        if(strlen($encrypted) > 512000) //
        {
            return new JsonResponse([
                'status' => "Encrypted data is too long (over 500KB)"
            ], $status = 403);
        }

        $entityManager = $doctrine->getManager();

        $note = new Note();
        $note->setGuid($guid);
        $note->setEncrypted($encrypted);
        $note->setKeyhash($keyhash);
        $note->setDestroyOnRead($destroyOnRead);
        $note->setAllowDelete($allowDelete);

        $expire = new \DateTime(); 
        $expire->add(\DateInterval::createFromDateString($daysToLive . ' day'));
        $note->setExpire($expire);

        $entityManager->persist($note);
        $entityManager->flush();


        $httpHost = $request->server->get('HTTP_HOST');

        return new JsonResponse([
            'link' => "https://{$httpHost}/n/{$guid}",
        ]);
    }


    public function createSaveServerEncryption(ManagerRegistry $doctrine, Request $request): JsonResponse
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


    public function readServerDecryption(ManagerRegistry $doctrine, Request $request, string $guid): JsonResponse
    {

        $key = $request->request->get('key'); //POST
        

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