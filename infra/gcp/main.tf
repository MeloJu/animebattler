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
  name          = "animebattler-subnet"
  network       = google_compute_network.main.id
  region        = var.region
  ip_cidr_range = "10.0.1.0/24"
}

# GCP nega ingress por padrão (egress já é liberado por padrão) — só
# precisa da regra de entrada. Cobre o mesmo papel da security list da
# Oracle.
resource "google_compute_firewall" "allow_ingress" {
  name    = "animebattler-allow-ingress"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_instance" "app" {
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
  }
}
