# Provisiona a VM Always Free (e2-micro), rede e firewall pro Anime
# Battler no Google Cloud. Ver ../../docs/deploy-gcp.md pra credenciais e
# passo a passo de uso.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.0"
    }
  }
}

# project, region e credenciais vêm de variáveis de ambiente
# (GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_PROJECT, GOOGLE_REGION), lidas
# automaticamente pelo provider — ver .env.example.
provider "google" {}

resource "google_compute_network" "main" {
  name                    = "animebattler-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  # checkov:skip=CKV_GCP_26: VPC Flow Logs cobra por volume de dado logado
  # no Cloud Logging — custo real fora do Always Free, pra uma VM só, sem
  # time de resposta a incidente rodando análise de fluxo de rede.
  name          = "animebattler-subnet"
  network       = google_compute_network.main.id
  region        = var.region
  ip_cidr_range = "10.0.1.0/24"
  # Deixa recurso SEM IP público (não é o caso desta VM hoje) alcançar API
  # do Google por IP privado em vez de sair pela internet — sem custo.
  private_ip_google_access = true
}

# GCP nega ingress por padrão (egress já é liberado por padrão) — só
# precisa da regra de entrada. Cobre o mesmo papel da security list da
# Oracle.
#
# DUAS REGRAS, NÃO UMA: web (80/443) precisa ser pública — é o próprio
# propósito do site, e o 80 também atende o desafio HTTP-01 do Let's
# Encrypt. SSH (22) não tem por que ser público — só quem administra
# entra por ali, então fica restrito a var.ssh_allowed_cidr.
resource "google_compute_firewall" "allow_web" {
  # checkov:skip=CKV_GCP_106: 80 público É o propósito — serve o site e
  # atende o desafio HTTP-01 do Let's Encrypt (ver Caddyfile). Redirecionar
  # tudo pra 443 aconteceria depois de já ter aceitado a conexão em 80, não
  # antes; fechar a porta quebraria a emissão de certificado.
  name    = "animebattler-allow-web"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "animebattler-allow-ssh"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.ssh_allowed_cidr]
}

resource "google_compute_instance" "app" {
  # checkov:skip=CKV_GCP_38: Customer Supplied Encryption Key exige guardar
  # E ROTACIONAR a própria chave de disco em algum lugar — troca um segredo
  # por outro segredo pra gerenciar, sem ganho real aqui (o disco já é
  # criptografado em repouso com chave gerenciada pelo Google por padrão;
  # CSEK é sobre QUEM controla a chave, não sobre criptografar ou não).
  # checkov:skip=CKV_GCP_40: sem NAT gateway/load balancer na frente (custo
  # fora do Always Free), a VM só é alcançável com IP público — é o próprio
  # desenho de instância única exposta direto.
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  # e2-micro só entra no Always Free em us-west1, us-central1 ou us-east1
  # (ver variables.tf) — fora dessas regiões a instância é cobrada normal.
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      # Standard persistent disk até 30GB é o limite do Always Free;
      # pd-ssd/pd-balanced não entram na cota gratuita.
      type = "pd-standard"
      size = 30
    }
  }

  network_interface {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.main.id
    access_config {} # IP público efêmero
  }

  metadata = {
    ssh-keys  = "${var.ssh_user}:${file(var.ssh_public_key_path)}"
    user-data = file("${path.module}/../shared/cloud-init.yaml")
    # Sem isto, uma chave SSH cadastrada a nível de PROJETO GCP (não desta
    # instância especificamente) também logaria aqui — superfície de acesso
    # que este projeto não pretende conceder implicitamente.
    block-project-ssh-keys = "true"
  }

  # e2-micro suporta Shielded VM sem custo extra: boot seguro, vTPM e
  # monitoramento de integridade contra rootkit/bootkit no nível do
  # hipervisor — camada abaixo de qualquer coisa que rode dentro da VM.
  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }
}
