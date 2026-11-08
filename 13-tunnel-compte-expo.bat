@echo off
chcp 65001 >nul
title Kitoko - tunnel Expo (compte williamsmith4004)
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "npm_config_legacy_peer_deps=true"
cd /d "D:\03 PROJETS\kitoko-app"
echo ============================================================
echo  1) Connexion a ton compte Expo (le meme que sur l'iPhone)
echo     Tape ton identifiant puis ton mot de passe (il ne s'affiche pas, c'est normal)
echo ============================================================
call npx expo whoami >nul 2>&1 || call npx expo login
echo.
echo ============================================================
echo  2) Demarrage du serveur avec le tunnel Expo
echo     Sur l'iPhone : scanne le QR code avec l'appareil photo,
echo     ou ouvre Expo Go : le serveur apparait dans "Development servers".
echo ============================================================
call npx expo start --tunnel --port 8083
pause
