@echo off
chcp 65001 >nul
title Kitoko - connexion Expo et tunnel
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "npm_config_legacy_peer_deps=true"
cd /d "D:\03 PROJETS\kitoko-app"
call npx expo whoami >nul 2>&1 && goto demarrer
echo ============================================================
echo  Connexion a ton compte Expo : williamsmith4004
echo  Tape ton MOT DE PASSE Expo puis Entree
echo  (il ne s'affiche pas pendant la frappe, c'est normal)
echo ============================================================
call npx expo login --no-browser --username williamsmith4004
:demarrer
echo.
echo ============================================================
echo  Demarrage du serveur Kitoko avec le tunnel Expo...
echo  iPhone : scanne le QR code avec l'appareil photo,
echo  ou ouvre Expo Go : le serveur apparait dans "Development servers".
echo ============================================================
call npx expo start --tunnel --port 8083
pause
