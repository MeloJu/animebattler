variable "region" {
  description = "Região GCP, ex: us-central1. Precisa combinar com a zone abaixo."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = <<-EOT
    Zona onde a VM nasce. O Always Free do e2-micro só vale em zonas de
    us-west1, us-central1 ou us-east1 — fora daí a instância é cobrada
    normalmente. Precisa estar dentro da region acima.
  EOT
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "Tipo da instância. e2-micro é o único elegível ao Always Free indefinido do GCP."
  type        = string
  default     = "e2-micro"
}

variable "instance_name" {
  description = "Nome da instância na Compute Engine."
  type        = string
  default     = "animebattler-vm"
}

variable "ssh_public_key_path" {
  description = "Caminho da chave pública SSH (ex: ~/.ssh/animebattler.pub) que vai ter acesso à VM."
  type        = string
}

variable "ssh_user" {
  description = "Usuário do SO associado à chave SSH (o cloud-init compartilhado assume 'ubuntu')."
  type        = string
  default     = "ubuntu"
}
