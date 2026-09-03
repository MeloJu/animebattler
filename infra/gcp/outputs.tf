output "public_ip" {
  description = "IP público da VM — use como SITE_ADDRESS (ou aponte um domínio pra ele) e como DEPLOY_HOST no GitHub."
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}
