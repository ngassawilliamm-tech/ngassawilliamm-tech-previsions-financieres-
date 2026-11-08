@echo off
chcp 65001 >nul
title Kitoko - mise a jour Node.js et Expo
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "NODEV=v24.11.0"
set "LOG=D:\03 PROJETS\kitoko-app\maj2-log.txt"
echo Mise a jour de Node.js vers %NODEV%... > "%LOG%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $z='%OUTILS%\node24.zip'; Invoke-WebRequest 'https://nodejs.org/dist/%NODEV%/node-%NODEV%-win-x64.zip' -OutFile $z; if (Test-Path '%OUTILS%\nodejs-ancien') { Remove-Item '%OUTILS%\nodejs-ancien' -Recurse -Force }; Rename-Item '%OUTILS%\nodejs' 'nodejs-ancien'; Expand-Archive $z -DestinationPath '%OUTILS%' -Force; Rename-Item '%OUTILS%\node-%NODEV%-win-x64' 'nodejs'; Remove-Item $z" >> "%LOG%" 2>&1
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
node -v >> "%LOG%" 2>&1
cd /d "D:\03 PROJETS\kitoko-app"
call npm install expo@latest --no-audit --no-fund --loglevel=error >> "%LOG%" 2>&1
call npx expo install --fix >> "%LOG%" 2>&1
call npx expo install query-string expo-asset expo-font >> "%LOG%" 2>&1
echo --- version --- >> "%LOG%"
findstr /c:"\"expo\":" /c:"\"expo-router\":" /c:"\"react\":" /c:"\"react-native\":" package.json >> "%LOG%"
echo --- compilation --- >> "%LOG%"
if exist .export-test rmdir /s /q .export-test
call npx expo export --platform android --clear --output-dir "D:\03 PROJETS\kitoko-app\.export-test" >> "%LOG%" 2>&1
echo CODE_SORTIE=%ERRORLEVEL% >> "%LOG%"
call npm install -g eas-cli --no-audit --no-fund --loglevel=error >> "%LOG%" 2>&1
echo TERMINE >> "%LOG%"
