terraform {
  required_version = ">= 1.6"

  cloud {
    organization = "DevOps-Pipeline-TinyLink"
    workspaces {
      name = "tinylink-app"
    }
  }

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
  }
}

provider "render" {
  api_key = var.render_api_key
}

provider "neon" {
  api_key = var.neon_api_key
}