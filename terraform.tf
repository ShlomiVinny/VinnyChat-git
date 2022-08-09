terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.19"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.3.1"
    }
  }
}

provider "aws" {
  region = ""
}

provider "mongodbatlas" {
  public_key  = ""
  private_key = ""
}
