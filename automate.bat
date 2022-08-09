CLS
@echo off
echo [94m**************************************[0m************************************
echo                    [1m[92mVinny Automation[0m 0.3.562
echo **************************************[94m************************************[0m
echo.
echo Welcome to Vinny's idea of what automation should look like...
echo.
echo [1m[95mStep 1:[0m
echo Choose whether you want the script to skip running the [4minit.bat[0m script
echo Which goes over some of the directories and runs [1mnpm i[0m
echo.
echo [1m[95mStep 2:[0m
echo Choose whether you want the script to create [4moutputs.json[0m files in the
echo appropriate directories. You need to perform this step if you want to
echo have proper integration between TF and some resources in this project
echo.
echo [1m[95mStep 3:[0m
echo Choose whether you want the script to build the react app
echo.
echo [1m[95mStep 4:[0m
echo Choose an option out of 3:
echo 1. [92mapply[0m - Normal 'terraform apply', will prompt you to approve
echo 2. [91mskip[0m - Skip this step
echo 3. [33ma[0m - Will call 'terraform apply --auto-approve', THE best option, IMO.
echo.
echo [1m[95mStep 5:[0m
echo If not skipped, the script will then call, in this order:
echo 'terraform fmt'
echo 'terraform init'
echo 'terraform apply'  OR  'terraform apply --auto-approve'
echo.
echo [1m[94mJust give it a try...[0m
echo.
echo [1m**************************************[94m************************************[0m
echo                                HELL [1m[94mYEAH[0m BROTHER!
echo [1m[94m**************************************[0m[1m************************************[0m
echo.
pause

echo [92m************************************************
echo              Skip running init.bat?
echo ************************************************[0m
:SKIPINIT
set /P skip=Do you want to skip running init.bat? [[1m[92my[0m/[91mn[0m]?
if /I "%skip%" EQU "y" goto :SKIPRUNINIT
if /I "%skip%" EQU "n" goto :RUNINIT
goto :SKIPINIT

:RUNINIT
call ./Scripts/init.bat
cd ..

goto :CONTINUEINIT

:SKIPRUNINIT
echo Skipped running init.bat!

:CONTINUEINIT
echo.
echo [92m************************************************
echo           Skip creating outputs.json?
echo ************************************************[0m
:skip1
set /P skip=Skip creating outputs.json? [[1m[92my[0m/[91mn[0m]?
if /I "%skip%" EQU "y" goto :SKIPOUTPUTS
if /I "%skip%" EQU "n" goto :OUTPUTS
goto :skip1

:OUTPUTS
echo Calling terraform to output a JSON into:
echo ./vc-react/src  -  vc-react src folder
echo ./VC-DAL/  -  VC-DAL src folder
terraform output -json > ./vc-react/src/outputs.json
terraform output -json > ./VC-DAL/outputs.json
echo JSONs Created!
goto :CONTINUE1

:SKIPOUTPUTS
echo Skipped outputs.json creation!

:CONTINUE1
echo.
echo [92m************************************************
echo             Skip building react app?
echo ************************************************[0m
:skip2
set /P skip=Skip building react app? [[1m[92my[0m/[91mn[0m]?
if /I "%skip%" EQU "y" goto :SKIPBUILD
if /I "%skip%" EQU "n" goto :BUILDREACT
goto :skip2

:BUILDREACT
REM call terraform to output a json into react/src dir so we can include it in our build, before we build react
echo.
echo Building the react frontend app! Please wait... 
REM build.bat changes directory to ./react! cd back later!
call Scripts/react-build.bat
REM now we need to cd back to VinnyScrape-TF dir
cd ..
pause
goto :TERRAFORM

:SKIPBUILD
echo Skipped building the react app!
pause

:TERRAFORM
CLS
echo [91m******************************************************
echo                         [1mWARNING![0m
echo [91m******************************************************
echo [41m[1m[90m*** Next step will apply the changes to terraform! ***[0m
echo.
REM set parameter c and get its value with %c%
REM this is still a bit foreign to me, but ill figure it out one day, as long as it works im ok with it
:choice2
echo Are you sure you want to apply these settings and
echo configuration to Terraform?
echo [1m[90mOPTIONS:  [92mapply ,  [91mskip ,  [33ma[0m = apply --auto-approve
set /P apply=[ [1m[92mapply[0m / [1m[91mskip[0m / [1m[33ma[0m ]? 
if /I "%apply%" EQU "apply" CALL :FORMATINIT apply
if /I "%apply%" EQU "skip" goto :ENDSCRIPT
if /I "%apply%" EQU "a" CALL :FORMATINIT a
goto :choice2

:FORMATINIT
echo.
echo [92m***************************************************
echo   Formatting and initializing Terraform backend!
echo ***************************************************[0m
terraform fmt
echo.
echo .tf files have been formatted!
echo.
terraform init
if "%~1" EQU "apply" goto :APPLY
if "%~1" EQU "a" goto :APPLYAUTO

:APPLY
echo.
echo [92m***************************************************
echo                     Applying...
echo ***************************************************[0m
terraform apply
goto :ENDSCRIPT

:APPLYAUTO
echo.
echo [92m***************************************************
echo             Applying with auto approve...
echo ***************************************************[0m
terraform apply --auto-approve
goto :ENDSCRIPT

:ENDSCRIPT
echo.
echo [1m[95m***************************************************
echo Script ended!
echo Thank you for using VinnyScrape Automation!
echo ***************************************************[0m
EXIT




REM Versioning: -- new entries on top, por favor --

REM Revision 0.3.562: Added another step in description for init.bat, Added some more coloring and style
REM Revision 0.3.532: Added Scraper-layered outputs.json
REM Revision 0.3.442: Added misc-files outputs.json, Added Scripts folder and changed the different paths
REM Revision 0.3.233: Added init.bat prompt
REM Revision 0.3.169: Added soem more coloring
REM Minor 0.3.0:      Added colors
REM Revision 0.2.813: Added a bunch of CLS, pause and echo. to format the outputs for a nicer look and behavior, also more readable
REM Revision 0.2.355: Fixed a minor bug with react skip - printing: Building react... when it wasnt
REM Revision 0.2.199: Added skip prompts to react build and terraform outputs
REM Minor 0.2.0:      Added auto apply to terraform prompt
REM Revision 0.1.708: Added automatic terraform fmt and terraform init
REM Revision 0.1.569: Fixed formatting issues with welcome screen, looks good now
REM Revision 0.1.504: Added welcome screen :)
REM Revision 0.1.349: Added outputs.json to /scraper-dkr
REM Revision 0.1.147: Added automatic terraform output to json to react/src 
REM Minor 0.1:        First working iteration: react is built and terraform apply works