$presentationPath = Join-Path -Path $PWD -ChildPath "docs\CLIENT_PRESENTATION_SLIDES.html"
$mockupPath = Join-Path -Path $PWD -ChildPath "docs\AI_GAMIFICATION_MOCKUP.html"

Write-Host "Opening presentation at: $presentationPath"
Start-Process $presentationPath

Write-Host "Opening mockup at: $mockupPath"
Start-Process $mockupPath

Write-Host "Files should open in your default browser. If they don't appear, please check your browser settings."