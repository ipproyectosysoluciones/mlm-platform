# =============================================================================
# Nexo Real — Terraform Outputs
# =============================================================================

output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.main.ip_address
}

output "vm_ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}

output "postgres_fqdn" {
  description = "PostgreSQL Flexible Server fully qualified domain name"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_port" {
  description = "PostgreSQL server port"
  value       = "5432"
}
