@echo off
REM arg1 is token.proxy_endpoint
REM arg2 is token.user_name
REM arg3 is aws_ecr_repository.scraper-repo.repository_url 
REM arg4 is image_tag

cd ./scraper-dkr

REM Use only one of the docker login lines/blocks below, if the first one doesnt work switch to the second one:

REM --- Use this one if you want to stay safe from cli log hackers :D i know you exist... ---
aws ecr get-login-password | docker login %~1 -u %~2 --password-stdin

REM --- Use this code block if the --password-stdin doesnt work again for some reason ---
@REM FOR /F "tokens=* USEBACKQ" %%F IN (`aws ecr get-login-password`) DO (
@REM SET pw=%%F
@REM )
@REM docker login %~1 -u %~2 -p %pw%

docker build -t %~3:%~4 .
docker push %~3:%~4