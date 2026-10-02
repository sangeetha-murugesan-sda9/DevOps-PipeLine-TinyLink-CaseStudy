variable "render_api_key" {
  type      = string
  sensitive = true
}

variable "neon_api_key" {
  type      = string
  sensitive = true
}

variable "image_ref" {
  type        = string
  description = "Full container image reference, e.g. ghcr.io/owner/repo:sha"
}