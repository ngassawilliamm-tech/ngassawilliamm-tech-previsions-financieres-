@echo off
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "PATH=%OUTILS%\nodejs;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
cd /d "D:\03 PROJETS\kitoko-app"
call npx expo login --help > "D:\03 PROJETS\kitoko-app\aide-login.txt" 2>&1
