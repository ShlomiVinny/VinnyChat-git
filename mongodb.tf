resource "mongodbatlas_cluster" "VC-cluster" {
  project_id                  = ""
  name                        = "VC-cluster"
  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = "EU_WEST_1"
  provider_instance_size_name = "M0"
  cloud_backup                = false
}
