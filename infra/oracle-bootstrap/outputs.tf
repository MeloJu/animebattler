# Estes dois valores são exatamente o que vai no backend.hcl do infra/oracle.
output "bucket_name" {
  description = "Nome do bucket de state."
  value       = oci_objectstorage_bucket.tfstate.name
}

output "namespace" {
  description = "Namespace do Object Storage da tenancy."
  value       = data.oci_objectstorage_namespace.ns.namespace
}
