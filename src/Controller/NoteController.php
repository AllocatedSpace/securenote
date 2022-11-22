<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\Note;
use App\Service\NoteGUID;
use App\Service\Cron;
use App\Service\RecaptchaV3Helper;

class NoteController extends AbstractController
{

    public function viewIndex(): Response
    {
        $GOOGLE_RECAPTCHA_SITE_KEY = $this->getParameter('app.GOOGLE_RECAPTCHA_SITE_KEY');
        
        $response = $this->render('note/view.html.twig', [
           'GOOGLE_RECAPTCHA_SITE_KEY' => $GOOGLE_RECAPTCHA_SITE_KEY
        ]);

        $response->setPublic();
        $response->setMaxAge(14400); //4 hours
        $response->headers->addCacheControlDirective('must-revalidate', true);

        return $response;
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

        if (!$resp->isSuccess()) 
        {
            $errors = $resp->getErrorCodes();

            return new JsonResponse([
                'status' => implode('; ', RecaptchaV3Helper::getErrorDescriptions($errors))
            ], $status = 403);
        } // recaptcha

        $this->tryCron($doctrine, $request);

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

        //we will just return the data. and whether or not it's been destroyed or will continue to live
        $encryptedData = stream_get_contents($note->getEncrypted());

        $deleteOnRead = $note->isDestroyOnRead();
        if($deleteOnRead)
        {
            $entityManager = $doctrine->getManager();
            $note->setEncrypted(''); //clear the encrypted data completely.
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

        if (!$resp->isSuccess()) 
        {
            $errors = $resp->getErrorCodes();
            return new JsonResponse([
                'status' => implode('; ', RecaptchaV3Helper::getErrorDescriptions($errors))
            ], $status = 403);
        } // recaptcha

        $this->tryCron($doctrine, $request);

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

    public function tryCron(ManagerRegistry $doctrine, Request $request)
    {
        if(false && mt_rand(1, 100) < 10) //disabled for now.
        {
            $REAL_CRON_KEY = $this->getParameter('app.CRON_KEY');
            
            // too much overhead 
            //Cron::startCron($REAL_CRON_KEY, $request); 

            $doctrine->getRepository(Note::class)->destroyExpired();

        }
    }


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

        if (!$resp->isSuccess()) 
        {
            $errors = $resp->getErrorCodes();
            return new JsonResponse([
                'status' => implode('; ', RecaptchaV3Helper::getErrorDescriptions($errors))
            ], $status = 403);
        } // recaptcha

        $this->tryCron($doctrine, $request);

        $guid = NoteGUID::uniqidReal();
        $encrypted = $request->request->get('encrypted'); 
        $keyhash = $request->request->get('keyhash'); 
        $destroyOnRead = $request->request->get('destroyonread') == '1';
        $rawTTL = $request->request->get('ttl');
        $TTLUnit = '';
        $TTLValue = '';

        if(!preg_match('~^[0-9]{1,2}[MHD]{1}$~', $rawTTL))
        {
            return new JsonResponse([
                'status' => "Invalid Time-To-Live value provided."
            ], $status = 403);
        }

        preg_match('~^([0-9]{1,2})([MHD]{1})$~', $rawTTL, $matches);

        $TTLValue = $matches[1];
        $TTLUnit = $matches[2];

        if($TTLValue < 1)
        {
            return new JsonResponse([
                'status' => "Invalid Time-To-Live value provided."
            ], $status = 403);
        }

        if($TTLUnit == 'D')
        { 
            if($TTLValue > 31)
            {
                return new JsonResponse([
                    'status' => "Invalid Time-To-Live value provided: max 31 days"
                ], $status = 403);
            }

            $TTLUnit = "day";
        }
        elseif($TTLUnit == 'H')
        { 
            if($TTLValue > 24)
            {
                return new JsonResponse([
                    'status' => "Invalid Time-To-Live value provided: max 24 hours"
                ], $status = 403);
            }

            $TTLUnit = "hour";
        }
        elseif($TTLUnit == 'M')
        { 
            if($TTLValue > 60)
            {
                return new JsonResponse([
                    'status' => "Invalid Time-To-Live value provided: max 60 minutes"
                ], $status = 403);
            }

            $TTLUnit = "minute";
        }
       
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
        $expire->add(\DateInterval::createFromDateString($TTLValue . ' ' . $TTLUnit));
        $note->setExpire($expire);

        $entityManager->persist($note);
        $entityManager->flush();

        $httpHost = $request->server->get('HTTP_HOST');

        return new JsonResponse([
            'link' => "https://{$httpHost}/n/{$guid}",
        ]);
    }

    public function cron(ManagerRegistry $doctrine, Request $request, string $cronkey): JsonResponse
    {

        //sleep(8); for TIMEOUT testing
        $REAL_CRON_KEY = $this->getParameter('app.CRON_KEY');

        if($REAL_CRON_KEY != $cronkey)
        {
            return new JsonResponse([
                'status' => 'Forbidden'
            ], $status = 403);
        }

        $deleted = $doctrine->getRepository(Note::class)->destroyExpired();
       
        return new JsonResponse([
            'success' => true
        ]);
        
    }

    /*
    public function test(): Response
    {
        
    }
    */


}
