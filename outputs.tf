output "VCAPI_endpoint" {
  value = "${aws_apigatewayv2_api.VCAPI.api_endpoint}/${aws_apigatewayv2_stage.vc-stage.name}"
}

output "VC_CF_Domain_name" {
  value       = "https://${aws_cloudfront_distribution.VC-distro.domain_name}"
  sensitive   = false
  description = "VC-distro domain name"
}

output "VC_Cognito_hostedui_queryParams" {
  value = {
    "response_type_param" : "response_type=code",
    "scope_param" : "scope=email+openid",
  }
  description = "End product should look like: https://CF_DOMAIN.auth.eu-west-2.amazoncognito.com/signup?client_id=COGNITO_APPCLIENT_ID&response_type=code&scope=email+openid&redirect_uri=https://CF_DISTRO_DOMAIN"
  sensitive   = true
}

output "VC_Cognito_userpool_domain_full" {
  value     = "https://${aws_cognito_user_pool_domain.VC-userpool-domain.domain}.auth.eu-west-2.amazoncognito.com"
  sensitive = true
}

output "VC_Cognito_userpool_domain_raw" {
  value     = aws_cognito_user_pool_domain.VC-userpool-domain.domain
  sensitive = false
}

output "VC_Cognito_userpool_client_id" {
  value     = aws_cognito_user_pool_client.VC-userpool-client.id
  sensitive = true
}

output "VC_Cognito_userpool_client_secret" {
  value     = aws_cognito_user_pool_client.VC-userpool-client.client_secret
  sensitive = true
}
