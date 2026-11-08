@echo off
chcp 65001 >nul
title Kitoko - installation (ne pas fermer)
set "OUTILS=D:\07 LOGICIELS ET RESSOURCES"
set "NODEV=v22.11.0"
set "NODEDIR=%OUTILS%\nodejs"
set "LOG=D:\03 PROJETS\kitoko-app\installation-log.txt"

echo Installation de Kitoko... > "%LOG%"
if not exist "%NODEDIR%\node.exe" (
  echo [1/4] Telechargement de Node.js %NODEV% vers le disque D...
  echo [1/4] Telechargement de Node.js >> "%LOG%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $z='%OUTILS%\node.zip'; Invoke-WebRequest 'https://nodejs.org/dist/%NODEV%/node-%NODEV%-win-x64.zip' -OutFile $z; Expand-Archive $z -DestinationPath '%OUTILS%' -Force; Rename-Item '%OUTILS%\node-%NODEV%-win-x64' 'nodejs'; Remove-Item $z" >> "%LOG%" 2>&1
) else (
  echo [1/4] Node.js deja installe sur D. >> "%LOG%"
)
if not exist "%NODEDIR%\node.exe" (
  echo ERREUR : Node.js n'a pas pu etre installe. >> "%LOG%"
  echo ERREUR : Node.js n'a pas pu etre installe. Voir installation-log.txt
  pause
  exit /b 1
)

rem Tout reste sur le disque D : programmes, cache et outils globaux
set "PATH=%NODEDIR%;%OUTILS%\npm-global;%PATH%"
set "npm_config_cache=%OUTILS%\npm-cache"
set "npm_config_prefix=%OUTILS%\npm-global"
node -v >> "%LOG%" 2>&1

cd /d "D:\03 PROJETS\kitoko-app"
echo [2/4] Installation des modules de l'app (quelques minutes)...
echo [2/4] npm install >> "%LOG%"
call npm install --no-audit --no-fund >> "%LOG%" 2>&1
echo [3/4] Alignement des versions Expo...
echo [3/4] expo install --fix >> "%LOG%"
call npx --yes expo install --fix >> "%LOG%" 2>&1
echo [4/4] Outil de compilation EAS...
echo [4/4] eas-cli >> "%LOG%"
call npm install -g eas-cli --no-audit --no-fund >> "%LOG%" 2>&1
echo TERMINE >> "%LOG%"
echo.
echo Installation terminee. Tu peux fermer cette fenetre.
pause
