# Bootstrap do state remoto — ovo e galinha.
#
# O bucket que guarda o tfstate do infra/oracle precisa existir ANTES daquele
# root conseguir usar o backend. Então ele nasce aqui, num root separado que
# usa state LOCAL mesmo (é o padrão pra bootstrap: se esse state sumir, o pior
# que acontece é reimportar/recriar um bucket, que é trivial — diferente de
# perder o state da VM).
#
# Mantido fora do infra/oracle de propósito: se o bucket fosse gerenciado pelo
# próprio root cujo state ele guarda, um `terraform destroy` lá derrubaria o
# backend embaixo dos próprios pés.
#
# Roda uma vez só. Ver ../../docs/deploy-oracle.md.

terraform {
  required_version = ">= 1.12.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

# Credenciais vêm do ~/.oci/config (padrão do OCI CLI/SDK), não de tfvars —
# um lugar só pra chave, compartilhado com o infra/oracle e com o backend.
provider "oci" {
  config_file_profile = var.config_file_profile
  region              = var.region
}

data "oci_objectstorage_namespace" "ns" {
  compartment_id = var.compartment_ocid
}

resource "oci_objectstorage_bucket" "tfstate" {
  compartment_id = var.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.ns.namespace
  name           = var.bucket_name
  access_type    = "NoPublicAccess"

  # Essencial pra state: permite recuperar uma versão anterior se um apply
  # for interrompido no meio e corromper/truncar o arquivo.
  versioning = "Enabled"

  freeform_tags = {
    project = "animebattler"
    purpose = "terraform-state"
  }
}
