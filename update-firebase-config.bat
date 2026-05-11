@echo off
REM Script pour mettre à jour la clé API Firebase dans tous les fichiers
REM Usage: update-firebase-config.bat "NEW_API_KEY" "NEW_AUTH_DOMAIN" "NEW_PROJECT_ID" "NEW_STORAGE_BUCKET" "NEW_MESSAGING_SENDER_ID" "NEW_APP_ID"

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo 🔧 MISE A JOUR DE LA CLE API FIREBASE
    echo ========================================
    echo.
    echo Usage: update-firebase-config.bat "API_KEY" "AUTH_DOMAIN" "PROJECT_ID" "STORAGE_BUCKET" "MESSAGING_ID" "APP_ID"
    echo.
    echo Exemple:
    echo update-firebase-config.bat "AIzaSy..." "mon-projet.firebaseapp.com" "mon-projet" "mon-projet.appspot.com" "123456789" "1:123:web:abc"
    echo.
    echo Sources des valeurs:
    echo 1. Allez a https://console.firebase.google.com/
    echo 2. Selectionnez votre projet
    echo 3. Cliquez Settings (gear icon) ^> Project Settings
    echo 4. Dans "Web apps", trouvez votre app
    echo 5. Copiez chaque valeur depuis la configuration Firebase
    echo.
    pause
    exit /b 1
)

set "API_KEY=%1"
set "AUTH_DOMAIN=%2"
set "PROJECT_ID=%3"
set "STORAGE_BUCKET=%4"
set "MESSAGING_SENDER_ID=%5"
set "APP_ID=%6"

echo.
echo 📝 Configuration a appliquer:
echo   API Key: %API_KEY%
echo   Auth Domain: %AUTH_DOMAIN%
echo   Project ID: %PROJECT_ID%
echo   Storage Bucket: %STORAGE_BUCKET%
echo   Messaging Sender ID: %MESSAGING_SENDER_ID%
echo   App ID: %APP_ID%
echo.

set /p confirm="Confirmer? (o/n): "
if /i not "%confirm%"=="o" (
    echo Annule.
    exit /b 0
)

REM Fichiers a mettre a jour
set "FILES=public\admin-login.html public\admin-dashboard.html public\admin-orders.html public\track-order.html server.js"

for %%F in (%FILES%) do (
    if exist "%%F" (
        echo Mise a jour de %%F...
        
        REM Remplacer les valeurs (PowerShell pour eviter les problemes d'echappement)
        powershell -Command "
            $file = '%%F'
            $content = Get-Content $file -Raw
            
            $content = $content -replace 'apiKey:\s*[\"'']AIzaSy[^\"'']*[\"'']', 'apiKey: \"%API_KEY%\"'
            $content = $content -replace 'authDomain:\s*[\"'']diamanosn-ea0a1\.firebaseapp\.com[\"'']', 'authDomain: \"%AUTH_DOMAIN%\"'
            $content = $content -replace 'projectId:\s*[\"'']diamanosn-ea0a1[\"'']', 'projectId: \"%PROJECT_ID%\"'
            $content = $content -replace 'storageBucket:\s*[\"'']diamanosn-ea0a1\.appspot\.com[\"'']', 'storageBucket: \"%STORAGE_BUCKET%\"'
            $content = $content -replace 'messagingSenderId:\s*[\"'']918076707387[\"'']', 'messagingSenderId: \"%MESSAGING_SENDER_ID%\"'
            $content = $content -replace 'appId:\s*[\"'']1:918076707387:web:[^\"'']*[\"'']', 'appId: \"%APP_ID%\"'
            
            Set-Content $file -Value $content
            Write-Host '✅ $file mise a jour'
        "
    ) else (
        echo ⚠️  %F% non trouve
    )
)

echo.
echo ✅ Mise a jour completee!
echo.
echo Prochaines etapes:
echo 1. Redemarrez le serveur: node server.js
echo 2. Rafraichissez le navigateur: Ctrl+Shift+R
echo 3. Testez: http://localhost:3000/firebase-test.html
echo.
pause
