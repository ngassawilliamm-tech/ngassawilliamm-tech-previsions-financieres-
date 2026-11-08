@echo off
chcp 65001 >nul
title Kitoko - serveur de test (mode tunnel)
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "npm_config_legacy_peer_deps=true"
cd /d "D:\03 PROJETS\kitoko-app"
echo Preparation du tunnel (premiere fois : 1 a 2 minutes)...
call npm install -g @expo/ngrok@^4.1.0 --no-audit --no-fund --loglevel=error
echo.
echo Dans Expo Go : "Scan QR code", ou "Enter URL manually" avec l'adresse exp:// affichee plus bas.
call npx expo start --tunnel ngrok --port 8082
pause
