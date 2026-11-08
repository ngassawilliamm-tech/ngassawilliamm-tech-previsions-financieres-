@echo off
chcp 65001 >nul
title Kitoko - mise a jour Expo et verification
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "LOG=D:\03 PROJETS\kitoko-app\mise-a-jour-log.txt"
cd /d "D:\03 PROJETS\kitoko-app"
echo Mise a jour... > "%LOG%"
call npm install expo@latest --no-audit --no-fund >> "%LOG%" 2>&1
call npx expo install --fix >> "%LOG%" 2>&1
call npx expo install query-string expo-asset expo-font >> "%LOG%" 2>&1
echo --- version --- >> "%LOG%"
call npx expo --version >> "%LOG%" 2>&1
findstr /c:"\"expo\":" package.json >> "%LOG%"
echo --- compilation --- >> "%LOG%"
if exist .export-test rmdir /s /q .export-test
call npx expo export --platform android --clear --output-dir "D:\03 PROJETS\kitoko-app\.export-test" >> "%LOG%" 2>&1
echo CODE_SORTIE=%ERRORLEVEL% >> "%LOG%"
echo TERMINE >> "%LOG%"
