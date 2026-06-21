@echo off
setlocal

cd /d "%~dp0"

echo Installing desktop app dependencies...
call npm install

echo Building frontend...
cd ..\frontend
call npm run build

echo Building desktop app...
cd ..\desktop
call npm run build

echo Desktop app build complete!
echo Output files are in desktop\dist\
pause
