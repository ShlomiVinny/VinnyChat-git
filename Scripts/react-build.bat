@echo off
REM first we need to cd to the react dir
cd ./vc-react
echo Running 'npm run build' ...
npm run build

REM no need to cd .., it doesnt work here