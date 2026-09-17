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

variable "ssh_allowed_cidr" {
  description = <<-EOT
    Faixa de origem liberada pra SSH (porta 22) no firewall. NUNCA
    0.0.0.0/0 — mesmo com chave pública barrando senha, deixar a porta
    aberta pro mundo é ruído de bot de brute-force e superfície de ataque
    à toa.

    Descoberta com `curl -s https://rdap.org/ip/SEU_IP`: o campo
    "handle"/"cidr" da resposta é a faixa alocada pro seu provedor. Para
    IP residencial DINÂMICO, use essa faixa (geralmente um /22 ou /20) em
    vez do /32 exato — sobrevive à troca de IP dentro do mesmo provedor.
    Trocou de provedor? Repita a consulta e atualize aqui.
  EOT
  type        = string
}
