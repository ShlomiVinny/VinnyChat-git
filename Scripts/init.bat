CLS
@echo off
echo [91m******************************************************
echo                         [1mWARNING![0m
echo [91m******************************************************
echo [41m[1m[90m*** You are about to run init.bat! ***[0m
echo This will go over the different directories that come with
echo this project and will call 'npm i' in all of them!
echo.
echo [41m[1m[90m*** This will take some time, sit back! ***[0m
echo.
:skip
set /P skip=Continue with initializing? [[92my[0m/[91mn[0m]?
if /I "%skip%" EQU "y" goto :CONTINUE
if /I "%skip%" EQU "n" goto :SKIP
goto :skip

:CONTINUE
echo Initializing...
echo.
echo [41m[1m[90m*** Installing React dependencies... ***[0m
cd ./vc-react
CMD /C npm i
echo [92mSuccessfully Installed!
echo.
echo [92m******************************************************
echo          [1mDependencies Successfully Installed!![0m
echo [92m******************************************************[0m
goto :END

:SKIP
echo.
echo Skipped initializing! Are you sure you know what you are doing?
:END