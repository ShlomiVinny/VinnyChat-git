locals {
  dev_server_origin = "http://localhost:3000"
  VCAPI_name        = "VCAPI"
  VCAPI_protocol    = "WEBSOCKET"
  integration_type  = "AWS_PROXY"
}

resource "aws_apigatewayv2_api" "VCAPI" {
  name                       = local.VCAPI_name
  protocol_type              = local.VCAPI_protocol
  route_selection_expression = "$request.body.action"

}

resource "aws_apigatewayv2_integration" "VC-Integration" {
  api_id           = aws_apigatewayv2_api.VCAPI.id
  integration_type = local.integration_type
  integration_uri  = aws_lambda_function.VC.invoke_arn
}

resource "aws_apigatewayv2_integration" "VC-DAL-Integration" {
  api_id           = aws_apigatewayv2_api.VCAPI.id
  integration_type = local.integration_type
  integration_uri  = aws_lambda_function.VC-DAL.invoke_arn
}

resource "aws_apigatewayv2_stage" "vc-stage" {
  api_id      = aws_apigatewayv2_api.VCAPI.id
  name        = "production"
  auto_deploy = true
}

# ---------------------------------------- routes -------------------------------------------
resource "aws_apigatewayv2_route" "connect-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "disconnect-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "postNew-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "postNew"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "postNewQuote-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "postNewQuote"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "getConnectedUsers-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "getConnectedUsers"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "getOwnId-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "getOwnId"
  target    = "integrations/${aws_apigatewayv2_integration.VC-Integration.id}"
}
resource "aws_apigatewayv2_route" "getStoredMessages-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "getStoredMessages"
  target    = "integrations/${aws_apigatewayv2_integration.VC-DAL-Integration.id}"
}
resource "aws_apigatewayv2_route" "verifyAuthCode-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "verifyAuthCode"
  target    = "integrations/${aws_apigatewayv2_integration.VC-DAL-Integration.id}"
}
resource "aws_apigatewayv2_route" "authenticateUser-route" {
  api_id    = aws_apigatewayv2_api.VCAPI.id
  route_key = "authenticateUser"
  target    = "integrations/${aws_apigatewayv2_integration.VC-DAL-Integration.id}"
}