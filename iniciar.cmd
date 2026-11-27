@echo off
rem Inicia o ORDO em modo local usando o Node 22 portatil (o Expo 58 exige Node >= 22.13).
set "NODE22=%USERPROFILE%\tools\node-v22.14.0-win-x64"
if exist "%NODE22%\node.exe" set "PATH=%NODE22%;%PATH%"
cd /d "%~dp0"
node -v
call npx expo start %*
