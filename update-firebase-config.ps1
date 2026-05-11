# Script pour mettre à jour la clé API Firebase
# Usage: .\update-firebase-config.ps1 "NEW_API_KEY" "NEW_AUTH_DOMAIN" "NEW_PROJECT_ID" ...

param(
    [string]$ApiKey = "",
    [string]$AuthDomain = "",
    [string]$ProjectId = "",
    [string]$StorageBucket = "",
    [string]$MessagingSenderId = "",
    [string]$AppId = ""
)

# Afficher l'aide si pas de parametres
if (-not $ApiKey) {
    Write-Host "`n🔧 MISE A JOUR DE LA CLE API FIREBASE" -ForegroundColor Cyan
    Write-Host "========================================`n"
    Write-Host "Usage: .\update-firebase-config.ps1 -ApiKey 'KEY' -AuthDomain 'DOMAIN' -ProjectId 'ID' -StorageBucket 'BUCKET' -MessagingSenderId 'ID' -AppId 'ID'" -ForegroundColor Yellow
    Write-Host "`nExemple:"
    Write-Host ".\update-firebase-config.ps1 -ApiKey 'AIzaSy...' -AuthDomain 'mon-projet.firebaseapp.com' -ProjectId 'mon-projet' -StorageBucket 'mon-projet.appspot.com' -MessagingSenderId '123456789' -AppId '1:123:web:abc'" -ForegroundColor Green
    Write-Host "`nSources des valeurs:"
    Write-Host "1. Allez a https://console.firebase.google.com/"
    Write-Host "2. Selectionnez votre projet"
    Write-Host "3. Cliquez Settings (gear icon) > Project Settings"
    Write-Host "4. Dans 'Web apps', trouvez votre app"
    Write-Host "5. Copiez chaque valeur depuis la configuration Firebase`n"
    exit
}

Write-Host "`n📝 Configuration a appliquer:" -ForegroundColor Cyan
Write-Host "   API Key: $ApiKey"
Write-Host "   Auth Domain: $AuthDomain"
Write-Host "   Project ID: $ProjectId"
Write-Host "   Storage Bucket: $StorageBucket"
Write-Host "   Messaging Sender ID: $MessagingSenderId"
Write-Host "   App ID: $AppId`n"

$confirm = Read-Host "Confirmer? (o/n)"
if ($confirm -ne "o") {
    Write-Host "Annule." -ForegroundColor Yellow
    exit
}

# Fichiers a mettre a jour
$files = @(
    "public\admin-login.html",
    "public\admin-dashboard.html",
    "public\admin-orders.html",
    "public\track-order.html",
    "server.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Mise a jour de $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Remplacer les anciennes valeurs
        $content = $content -replace 'apiKey:\s*"AIzaSy[^"]*"', "apiKey: `"$ApiKey`""
        $content = $content -replace "apiKey:\s*'AIzaSy[^']*'", "apiKey: '$ApiKey'"
        
        $content = $content -replace 'authDomain:\s*"diamanosn-ea0a1\.firebaseapp\.com"', "authDomain: `"$AuthDomain`""
        $content = $content -replace "authDomain:\s*'diamanosn-ea0a1\.firebaseapp\.com'", "authDomain: '$AuthDomain'"
        
        $content = $content -replace 'projectId:\s*"diamanosn-ea0a1"', "projectId: `"$ProjectId`""
        $content = $content -replace "projectId:\s*'diamanosn-ea0a1'", "projectId: '$ProjectId'"
        
        $content = $content -replace 'storageBucket:\s*"diamanosn-ea0a1\.appspot\.com"', "storageBucket: `"$StorageBucket`""
        $content = $content -replace "storageBucket:\s*'diamanosn-ea0a1\.appspot\.com'", "storageBucket: '$StorageBucket'"
        
        $content = $content -replace 'messagingSenderId:\s*"918076707387"', "messagingSenderId: `"$MessagingSenderId`""
        $content = $content -replace "messagingSenderId:\s*'918076707387'", "messagingSenderId: '$MessagingSenderId'"
        
        $content = $content -replace 'appId:\s*"1:918076707387:web:[^"]*"', "appId: `"$AppId`""
        $content = $content -replace "appId:\s*'1:918076707387:web:[^']*'", "appId: '$AppId'"
        
        Set-Content $file -Value $content -Encoding UTF8
        Write-Host "✅ $file mise a jour" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $file non trouve" -ForegroundColor Red
    }
}

Write-Host "`n✅ Mise a jour completee!`n" -ForegroundColor Green
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Redemarrez le serveur: node server.js"
Write-Host "2. Rafraichissez le navigateur: Ctrl+Shift+R"
Write-Host "3. Testez: http://localhost:3000/firebase-test.html`n"
