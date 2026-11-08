@echo off
chcp 65001 >nul
title Kitoko - connexion Expo (laisser ouvert)
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
set "LOG=D:\03 PROJETS\kitoko-app\connexion-expo-log.txt"
cd /d "D:\03 PROJETS\kitoko-app"
echo Connexion a Expo en cours : le lien s'ouvre dans le navigateur de l'app Claude...
call npx expo login > "%LOG%" 2>&1
echo FIN_CONNEXION >> "%LOG%"
call npx expo whoami >> "%LOG%" 2>&1
echo TERMINE >> "%LOG%"
