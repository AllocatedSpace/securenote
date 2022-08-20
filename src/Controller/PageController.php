<?php


namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class PageController extends AbstractController
{

    public function howItWorks(): Response
    {
        return $this->render('static/howitworks.html.twig', []);
    }

    public function privacy(): Response
    {
        return $this->render('static/privacy.html.twig', []);
    }

    


}