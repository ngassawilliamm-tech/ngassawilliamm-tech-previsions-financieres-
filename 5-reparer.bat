@echo off
chcp 65001 >nul
title Kitoko - reinstallation propre et verification
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "LOG=D:\03 PROJETS\kitoko-app\reparation-log.txt"
cd /d "D:\03 PROJETS\kitoko-app"
echo Reinstallation propre... > "%LOG%"
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
if exist .export-test rmdir /s /q .export-test
call npm install --no-audit --no-fund >> "%LOG%" 2>&1
echo --- expo doctor --- >> "%LOG%"
call npx expo install --check >> "%LOG%" 2>&1
echo --- compilation --- >> "%LOG%"
call npx expo export --platform android --output-dir "D:\03 PROJETS\kitoko-app\.export-test" >> "%LOG%" 2>&1
echo CODE_SORTIE=%ERRORLEVEL% >> "%LOG%"
echo TERMINE >> "%LOG%"
