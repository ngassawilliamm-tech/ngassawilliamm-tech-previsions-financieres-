@echo off
chcp 65001 >nul
title Kitoko - serveur de test (laisser ouvert)
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
cd /d "D:\03 PROJETS\kitoko-app"
echo Scanne le QR code avec Expo Go (Android) ou l'appareil photo (iPhone).
echo Le telephone et le PC doivent etre sur le meme Wi-Fi.
call npx expo start
pause
