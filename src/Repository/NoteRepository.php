<?php

namespace App\Repository;

use App\Entity\Note;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\DBAL\Types\Types;

/**
 * @extends ServiceEntityRepository<Note>
 *
 * @method Note|null find($id, $lockMode = null, $lockVersion = null)
 * @method Note|null findOneBy(array $criteria, array $orderBy = null)
 * @method Note[]    findAll()
 * @method Note[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class NoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Note::class);
    }

    public function add(Note $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Note $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }


    public function destroyExpired()
    {

        $conn = $this->getEntityManager()->getConnection();

        $sql = 'UPDATE note set encrypted = :encrypted, destroyed = CURRENT_TIMESTAMP() where expire < :expired and destroyed is null';

        $paramValues = array('encrypted' => '', 'expired' => new \DateTimeImmutable());
        $paramTypes = array('encrypted' => \PDO::PARAM_STR, 'expired' => Types::DATETIME_IMMUTABLE);
        
        $conn->executeUpdate($sql, $paramValues, $paramTypes);

    }

   public function findOneByGuid($value): ?Note
   {
       return $this->createQueryBuilder('n')
           ->andWhere('n.guid = :val')
           ->setParameter('val', $value)
           ->getQuery()
           ->getOneOrNullResult()
       ;
   }

   public function findOneByGuidAndKeyHash($guid, $keyHash): ?Note
   {
       return $this->createQueryBuilder('n')
           ->andWhere('n.guid = :val')
           ->andWhere('n.keyhash = :hash')
           ->setParameter('val', $guid)
           ->setParameter('hash', $keyHash)
           ->getQuery()
           ->getOneOrNullResult()
       ;
   }

}
