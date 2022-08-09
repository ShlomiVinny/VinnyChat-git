resource "aws_iam_role" "lambda-role" {
  name               = "lambda-role"
  assume_role_policy = <<EOF
{
   "Version": "2012-10-17",
   "Statement": [
       {
           "Action": "sts:AssumeRole",
           "Principal": {
               "Service": "lambda.amazonaws.com"
           },
           "Effect": "Allow"
       }
   ]
}
EOF
}

data "aws_iam_policy_document" "lambda-iam-policy-doc" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "lambda:InvokeFunction",
      "execute-api:ManageConnections"
    ]
    effect    = "Allow"
    resources = ["*"]
    sid       = "CreateCloudWatchLogs"
  }
}

resource "aws_iam_policy" "lambda-logs-policy" {
  name   = "iam-lambda-policy"
  policy = data.aws_iam_policy_document.lambda-iam-policy-doc.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda-role.name
  policy_arn = aws_iam_policy.lambda-logs-policy.arn
}
