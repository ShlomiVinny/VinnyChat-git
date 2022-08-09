locals {
  VC-DAL_srcdir_path       = "./VC-DAL"
  VC-DAL_output_path       = "./VC-DAL/VC-DAL.zip"
  VC-DAL-layer_output_path = "./VC-DAL/VC-DAL-layer.zip"
}

resource "aws_lambda_permission" "invoke-VC-DAL" {
  statement_id  = "AllowExecFromScraperAPI"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.VC-DAL.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.VCAPI.execution_arn}/*"
}

data "archive_file" "VC-DALArchive" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = local.VC-DAL_srcdir_path
  output_path      = local.VC-DAL_output_path
  excludes         = ["VC-DAL.zip", "node_modules", "VC-DAL-layer.zip", "nodejs", "prepare-layer.bat"]
}

resource "aws_lambda_function" "VC-DAL" {
  depends_on = [
    data.archive_file.VC-DALArchive
  ]
  function_name    = "VC-DAL"
  role             = aws_iam_role.lambda-role.arn
  filename         = "VC-DAL/VC-DAL.zip"
  handler          = "VC-DAL.VCDAL"
  runtime          = "nodejs16.x"
  memory_size      = 1024
  timeout          = 15
  source_code_hash = data.archive_file.VC-DALArchive.output_base64sha256
  layers           = [aws_lambda_layer_version.VC-DAL-node-modules.id, aws_lambda_layer_version.VC-layer.id]
  environment {
    variables = {
      VC_MONGO_URI = local.VC_MONGO_URI
    }
  }
}

data "archive_file" "VC-DAL-layer-archive" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = local.VC-DAL_srcdir_path
  output_path      = local.VC-DAL-layer_output_path
  excludes         = ["VC-DAL.zip", "package.json", "package-lock.json", "VC-DAL.mjs", "VC-DAL.js", "outputs.json", "VC-DAL-layer.zip", "node_modules", "prepare-layer.bat"]
}

resource "aws_lambda_layer_version" "VC-DAL-node-modules" {
  depends_on = [
    data.archive_file.VC-DAL-layer-archive
  ]
  description              = "layer for VC-DAL/node_modules which includes: node-fetch and mongoDB"
  layer_name               = "VC-DAL-node-modules"
  filename                 = data.archive_file.VC-DAL-layer-archive.output_path
  compatible_runtimes      = ["nodejs16.x"]
  compatible_architectures = ["x86_64"]
  source_code_hash         = data.archive_file.VC-DAL-layer-archive.output_base64sha256
}

