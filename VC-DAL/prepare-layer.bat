@echo off
CLS
echo [92m******************************************************
echo                   [1mPrepare lambda layer[0m
echo [92m******************************************************[0m
echo.
echo This script will make a nodejs/ directory, then it 
echo will copy ./node_modules to:  /nodejs/node_modules
echo This will prepare the node_modules folder for lambda
echo layer integration, this script assumes you already have
echo all your deps installed locally!
echo.
pause
echo.
mkdir nodejs
echo.
powershell cp -recurse -force node_modules nodejs/
echo.
echo [92m******************************************************
echo                   [1mLambda layer prepared![0m
echo [92m******************************************************[0m
exit