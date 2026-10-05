resource "neon_project" "tinylink" {
  name                      = "tinylink"
  region_id                 = "aws-eu-central-1"
  org_id                    = "org-old-dawn-13403857"
  history_retention_seconds = 21600
}

locals {
  image_parts = split(":", var.image_ref)
  image_repo  = local.image_parts[0]
  image_tag   = local.image_parts[1]
}

# Changes whenever a new image tag is deployed; used to force a replace.
resource "terraform_data" "image_version" {
  input = local.image_tag
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

  lifecycle {
    replace_triggered_by = [terraform_data.image_version]
  }
}