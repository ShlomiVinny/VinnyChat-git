locals {
  VC_srcdir_path       = "${path.module}/VC"
  VC_output_path       = "${path.module}/VC/VC.zip"
  VC-layer_output_path = "${path.module}/VC/VC-layer.zip"
  VC_MONGO_URI         = ""
}

resource "aws_lambda_permission" "invoke-VC" {
  statement_id  = "AllowExecFromVCAPI"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.VC.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.VCAPI.execution_arn}/*"
}

data "archive_file" "VCArchive" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = local.VC_srcdir_path
  output_path      = local.VC_output_path
  excludes         = ["VC.zip", "node_modules", "VC-layer.zip", "nodejs", "prepare-layer.bat"]
}

resource "aws_lambda_function" "VC" {
  depends_on = [
    data.archive_file.VCArchive
  ]
  function_name    = "VC"
  role             = aws_iam_role.lambda-role.arn
  filename         = "VC/VC.zip"
  handler          = "VC.VC"
  runtime          = "nodejs16.x"
  memory_size      = 512
  timeout          = 10
  layers           = [aws_lambda_layer_version.VC-layer.id]
  source_code_hash = data.archive_file.VCArchive.output_base64sha256
  environment {
    variables = {
      VC_MONGO_URI = local.VC_MONGO_URI
    }
  }
}

data "archive_file" "VC-layer-archive" {
  type             = "zip"
  output_file_mode = "0666"
  source_dir       = local.VC_srcdir_path
  output_path      = local.VC-layer_output_path
  excludes         = ["VC.zip", "package.json", "package-lock.json", "VC.js", "outputs.json", "VC-layer.zip", "node_modules", "prepare-layer.bat"]
}

resource "aws_lambda_layer_version" "VC-layer" {
  depends_on = [
    data.archive_file.VC-layer-archive
  ]
  description              = "layer for /node_modules"
  layer_name               = "VC-layer"
  filename                 = data.archive_file.VC-layer-archive.output_path
  compatible_runtimes      = ["nodejs16.x"]
  compatible_architectures = ["x86_64"]
  source_code_hash         = data.archive_file.VC-layer-archive.output_base64sha256
}

