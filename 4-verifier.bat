@echo off
chcp 65001 >nul
title Kitoko - verification du code
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "LOG=D:\03 PROJETS\kitoko-app\verification-log.txt"
cd /d "D:\03 PROJETS\kitoko-app"
echo Verification en cours... > "%LOG%"
call npx expo install expo-asset expo-font >> "%LOG%" 2>&1
call npx expo export --platform android --output-dir "D:\03 PROJETS\kitoko-app\.export-test" >> "%LOG%" 2>&1
echo CODE_SORTIE=%ERRORLEVEL% >> "%LOG%"
echo TERMINE >> "%LOG%"
