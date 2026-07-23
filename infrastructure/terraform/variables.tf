# =============================================================================
# Nexo Real — Terraform Variables
# =============================================================================

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "nexoreal"
}

variable "location" {
  description = "Azure region for resource deployment"
  type        = string
  default     = "brazilsouth"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2ats_v2"
}

variable "admin_username" {
  description = "VM administrator username"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  # Example: "ssh-ed25519 AAAAC3Nz... user@host"
}

variable "postgres_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "allowed_ssh_ips" {
  description = "List of IPs allowed to SSH into the VM"
  type        = list(string)
  # Example: ["203.0.113.10", "198.51.100.20"]
}

variable "cloudflare_ips" {
  description = "Cloudflare edge IP ranges for HTTP/HTTPS NSG rules"
  type        = list(string)
  default = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22"
  ]
}

variable "tags" {
  description = "Default tags applied to all resources"
  type        = map(string)
  default = {
    Project   = "NexoReal"
    ManagedBy = "Terraform"
    Environment = "production"
  }
}
