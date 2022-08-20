<?php

namespace App\Entity;

use App\Repository\NoteRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass=NoteRepository::class)
 * @ORM\Table(indexes={
 *  @ORM\Index(name="guidkeyhash", columns={"guid", "keyhash"}),
 *  @ORM\Index(name="guid", columns={"guid"}),
 *  @ORM\Index(name="expire", columns={"expire"}),
 *  @ORM\Index(name="keyhash", columns={"keyhash"})
 * })
 */
class Note
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=26)
     */
    private $guid;

    /**
     * @ORM\Column(type="blob")
     */
    private $encrypted;

    /**
     * @ORM\Column(type="boolean")
     */
    private $destroyOnRead;

    /**
     * @ORM\Column(type="datetime")
     */
    private $expire;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $destroyed;

    /**
     * @ORM\Column(type="string", length=64)
     */
    private $keyhash;

    /**
     * @ORM\Column(type="boolean")
     */
    private $allowDelete;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGuid(): ?string
    {
        return $this->guid;
    }

    public function setGuid(string $guid): self
    {
        $this->guid = $guid;

        return $this;
    }

    public function getEncrypted()
    {
        return $this->encrypted;
    }

    public function setEncrypted($encrypted): self
    {
        $this->encrypted = $encrypted;

        return $this;
    }

    public function isDestroyOnRead(): ?bool
    {
        return $this->destroyOnRead;
    }

    public function setDestroyOnRead(bool $destroyOnRead): self
    {
        $this->destroyOnRead = $destroyOnRead;

        return $this;
    }

    public function getExpire(): ?\DateTimeInterface
    {
        return $this->expire;
    }

    public function setExpire(\DateTimeInterface $expire): self
    {
        $this->expire = $expire;

        return $this;
    }

    public function getDestroyed(): ?\DateTimeInterface
    {
        return $this->destroyed;
    }

    public function setDestroyed(?\DateTimeInterface $destroyed): self
    {
        $this->destroyed = $destroyed;

        return $this;
    }

    public function getKeyhash(): ?string
    {
        return $this->keyhash;
    }

    public function setKeyhash(string $keyhash): self
    {
        $this->keyhash = $keyhash;

        return $this;
    }

    public function isAllowDelete(): ?bool
    {
        return $this->allowDelete;
    }

    public function setAllowDelete(bool $allowDelete): self
    {
        $this->allowDelete = $allowDelete;

        return $this;
    }
}
