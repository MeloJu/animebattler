output "public_ip" {
  description = "IP público da VM — use como SITE_ADDRESS (ou aponte um domínio pra ele) e como DEPLOY_HOST no GitHub."
  value       = oci_core_instance.app.public_ip
}
