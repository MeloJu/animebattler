# Provisiona a VM Always Free (Ampere/ARM ou AMD E2.1.Micro, ver
# variables.instance_shape), rede e firewall pro Anime Battler no Oracle
# Cloud. Ver ../../docs/deploy-oracle.md pra credenciais e passo a passo.
#
# Os recursos estão divididos por assunto: network.tf (VCN/firewall) e
# compute.tf (imagem + instância). Terraform concatena todo .tf do diretório,
# então a divisão é só pra leitura humana.

terraform {
  # 1.12+ por causa do backend nativo "oci" (o método antigo, via backend s3
  # compatível, exigia Customer Secret Keys e não tinha locking).
  required_version = ">= 1.12.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }

  # State remoto no Object Storage, com locking via If-None-Match. Config
  # parcial de propósito: bucket/namespace são identificadores da tenancy e
  # ficam no backend.hcl (gitignored, ver backend.hcl.example):
  #   terraform init -backend-config=backend.hcl
  #
  # O bucket em si nasce no infra/oracle-bootstrap (ovo e galinha).
  backend "oci" {}
}

# Credenciais vêm do ~/.oci/config (padrão do OCI CLI/SDK) em vez de tfvars —
# assim a chave fica num lugar só, compartilhada com o backend acima e com o
# root de bootstrap.
provider "oci" {
  config_file_profile = var.config_file_profile
  region              = var.region
}
