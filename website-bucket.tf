locals {
  build_src            = "/vc-react/build"
  frontend_bucket_name = "www.vc"
}

resource "aws_s3_bucket" "VCbucket" {
  bucket = local.frontend_bucket_name
  depends_on = [
    aws_apigatewayv2_api.VCAPI
  ]
}

#  ------------ Had to be removed for CF to work, since it needs access to ACLs ------------
# resource "aws_s3_bucket_ownership_controls" "vinny-scrape-ownership" {
#   bucket = aws_s3_bucket.vinny-scrape.id
#   rule {
#     object_ownership = "BucketOwnerEnforced"
#   }
# } this is only here for legacy' sake
#  ------------ Had to be removed for CF to work, since it needs access to ACLs ------------

resource "aws_s3_bucket_policy" "VCPolicy" {
  bucket = aws_s3_bucket.VCbucket.id
  policy = data.aws_iam_policy_document.VCPolicyDoc.json
}

data "aws_iam_policy_document" "VCPolicyDoc" {
  statement {
    sid = "vc-staticwebsitepermissions"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${aws_s3_bucket.VCbucket.arn}/*"
    ]
  }
}

# BIG thanks to hashicorp for addressing this terrible issue with the regular for_each loop that couldnt assign content_type properly!!!
# Otherwise it would have meant i would need to sit down and write all this shit manually, or figure out a way to do it... 
module "template_files" {
  source   = "hashicorp/dir/template"
  base_dir = "${path.module}${local.build_src}"
  template_vars = {
    # Pass in any values that you wish to use in your templates.
  }
}

resource "aws_s3_object" "build" {
  for_each     = module.template_files.files
  bucket       = aws_s3_bucket.VCbucket.id
  key          = each.key
  content_type = each.value.content_type
  # The template_files module guarantees that only one of these two attributes
  # will be set for each file, depending on whether it is an in-memory template
  # rendering result or a static file on disk.
  source  = each.value.source_path
  content = each.value.content
  # Unless the bucket has encryption enabled, the ETag of each object is an
  # MD5 hash of that object.
  etag = each.value.digests.md5
}


# --- Note: Unnecessary since i moved to CloudFront, but im gonna keep it as legacy fall-back code or something...
# resource "aws_s3_bucket_website_configuration" "VSWsConf" {
#   bucket = aws_s3_bucket.vinny-scrape.id
#   index_document {
#     suffix = "index.html"
#   }
#   # error document must be set if cloudfront is not used, otherwise if a user refreshes the page while using the app, it will throw a 404 NoSuchKey
#   # I saw that on cloudfront they let you redirect back to index.html on error (403 or 404) instead of returning an error page. which made me think its
#   # also possible right here in the s3 website conf, ill just redirect errors back to index and voila... it works!
#   error_document {
#     key = "index.html"
#   }
# }
