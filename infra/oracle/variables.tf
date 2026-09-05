variable "config_file_profile" {
  description = "Perfil no ~/.oci/config de onde vêm tenancy/user/fingerprint/key_file."
  type        = string
  default     = "DEFAULT"
}

variable "tenancy_ocid" {
  description = "OCID da tenancy (Profile > Tenancy no console OCI). Usado pra listar availability domains."
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

variable "instance_shape" {
  description = <<-EOT
    VM.Standard.A1.Flex (Ampere/ARM, precisa de shape_config, mas a cota
    Always Free é disputada — historicamente dá "out of host capacity")
    ou VM.Standard.E2.1.Micro (AMD, shape fixo sem shape_config, 1/8 OCPU
    + 1GB RAM, cota separada da Ampere e tida como sempre disponível).
  EOT
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "OCPUs da instância Ampere (ignorado fora de shapes *.Flex). Always Free cobre 2 no total desde 15/06/2026 (era 4)."
  type        = number
  default     = 2
}

variable "instance_memory_gb" {
  description = "Memória (GB) da instância Ampere (ignorado fora de shapes *.Flex). Always Free cobre 12GB no total desde 15/06/2026 (era 24)."
  type        = number
  default     = 12
}

variable "enable_ampere" {
  description = <<-EOT
    Sobe uma instância Ampere (2 OCPU/12GB) ao LADO da E2.1.Micro — as cotas
    são separadas, então testar não derruba a micro que já funciona. Se a
    região estiver sem capacidade, o apply falha com "Out of host capacity"
    e nada mais é tocado; é só voltar pra false.
  EOT
  type        = bool
  default     = false
}
