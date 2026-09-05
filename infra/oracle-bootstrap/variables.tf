variable "config_file_profile" {
  description = "Perfil no ~/.oci/config de onde vêm tenancy/user/fingerprint/key_file."
  type        = string
  default     = "DEFAULT"
}

variable "region" {
  description = "Região OCI onde o bucket de state vive."
  type        = string
  default     = "sa-saopaulo-1"
}

variable "compartment_ocid" {
  description = "OCID do compartment (pode ser o da tenancy)."
  type        = string
}

variable "bucket_name" {
  description = "Nome do bucket que guarda o tfstate. Precisa ser único dentro do namespace."
  type        = string
  default     = "animebattler-tfstate"
}
