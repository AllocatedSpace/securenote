<?php


namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class NotePageController extends AbstractController
{

    public function howItWorks(): Response
    {
        $response = $this->render('static/howitworks.html.twig', []);

        $response->setPublic();
        $response->setMaxAge(14400); //4 hours

        // (optional) set a custom Cache-Control directive
        $response->headers->addCacheControlDirective('must-revalidate', true);

        return $response;
    }

    public function privacy(): Response
    {
        $response = $this->render('static/privacy.html.twig', []);

        $response->setPublic();
        $response->setMaxAge(14400); //4 hours

        // (optional) set a custom Cache-Control directive
        $response->headers->addCacheControlDirective('must-revalidate', true);

        return $response;
    }


    public function generatePassword(): Response
    {
        $response = $this->render('static/generate-password.html.twig', []);

        $response->setPublic();
        $response->setMaxAge(14400); //4 hours

        // (optional) set a custom Cache-Control directive
        $response->headers->addCacheControlDirective('must-revalidate', true);

        return $response;
    }
    


}