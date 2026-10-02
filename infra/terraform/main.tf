resource "neon_project" "tinylink" {
  name      = "tinylink"
  region_id = "aws-eu-central-1"
}

locals {
  image_parts = split(":", var.image_ref)
  image_repo  = local.image_parts[0]
  image_tag   = local.image_parts[1]
}

resource "render_web_service" "tinylink" {
  name   = "tinylink"
  plan   = "free"
  region = "frankfurt"

  runtime_source = {
    image = {
      image_url = local.image_repo
      tag       = local.image_tag
    }
  }

  env_vars = {
    DATABASE_URL = { value = neon_project.tinylink.connection_uri }
    PGSSL        = { value = "true" }
    PORT         = { value = "3000" }
  }
}