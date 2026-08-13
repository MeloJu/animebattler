variable "tenancy_ocid" {
  description = "OCID da tenancy (Profile > Tenancy no console OCI)."
  type        = string
}

variable "user_ocid" {
  description = "OCID do usuário (Profile > User Settings)."
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint da API key gerada em Profile > API Keys."
  type        = string
}

variable "private_key_path" {
  description = "Caminho local do arquivo .pem da API key (o privado, baixado ao gerar a key)."
  type        = string
}

variable "region" {
  description = "Região OCI, ex: sa-saopaulo-1, us-ashburn-1."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID do compartment onde os recursos serão criados (pode ser o da própria tenancy pra começar)."
  type        = string
}

variable "ssh_public_key_path" {
  description = "Caminho da chave pública SSH (ex: ~/.ssh/animebattler.pub) que vai ter acesso à VM."
  type        = string
}

variable "instance_ocpus" {
  description = "OCPUs da instância Ampere. Always Free cobre até 4 no total."
  type        = number
  default     = 2
}

variable "instance_memory_gb" {
  description = "Memória (GB) da instância Ampere. Always Free cobre até 24GB no total."
  type        = number
  default     = 12
}
