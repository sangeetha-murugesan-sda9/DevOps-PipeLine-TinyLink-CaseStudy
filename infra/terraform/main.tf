# NOTE: the Render and Neon Terraform providers are both young — double
# check resource and attribute names against the current provider docs
# before relying on this; they've been known to drift between versions.
# https://registry.terraform.io/providers/render-oss/render/latest/docs
# https://registry.terraform.io/providers/kislerdm/neon/latest/docs

resource "neon_project" "tinylink" {
  name      = "tinylink"
  region_id = "aws-eu-central-1"
}

resource "render_web_service" "tinylink" {
  name   = "tinylink"
  plan   = "free"
  region = "frankfurt"

  runtime_source = {
    image = {
      image_url = "https://${var.image_ref}"
    }
  }

  env_vars = {
    DATABASE_URL = { value = neon_project.tinylink.connection_uri }
    PGSSL        = { value = "true" }
    PORT         = { value = "3000" }
  }
}