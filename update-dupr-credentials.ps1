# Update DUPR API credentials script

# Set the current working DUPR credentials
# These credentials have been tested and are working for authentication
$clientName = "Net Gains"
$clientId = "5208543024"
$clientKey = "test-ck-424f795f-f6d1-4220-f824-ae7ba1ae62d4"
$clientSecret = "test-cs-7a5bd1125c7b4b7cfc1aeb009d3c9e57"

Write-Host "DUPR API Credentials Update Script" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host ""

Write-Host "Using the following credentials:"
Write-Host "  Client Name: $clientName"
Write-Host "  Client ID: $clientId"
Write-Host "  Client Key: $clientKey"
Write-Host "  Client Secret: $clientSecret"

Write-Host ""
Write-Host "Setting credentials in Supabase..."

# Update credentials in Supabase
$cmd = "supabase secrets set DUPR_CLIENT_NAME=""$clientName"" DUPR_CLIENT_ID=""$clientId"" DUPR_CLIENT_KEY=""$clientKey"" DUPR_CLIENT_SECRET=""$clientSecret"""
Invoke-Expression $cmd

Write-Host ""
Write-Host "Testing the DUPR API connection..."

# Test the API
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVza2piempobGJkcnlub3RxdHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTc3MDEsImV4cCI6MjA3NjE3MzcwMX0.BdorsGP7d3Mv47AenDZVfAmhQPdUSq4oiUlDvFf4Ark"
$body = @{ action = "testClientAuth" } | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://eskjbzjhlbdrynotqtxz.supabase.co/functions/v1/dupr-api" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "SUCCESS! Authentication with DUPR API successful." -ForegroundColor Green
        Write-Host "The fixed authentication endpoint is working correctly." -ForegroundColor Green
    } else {
        Write-Host "API call completed but returned an error:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    # Try to get response content on error
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response content: $errorContent" -ForegroundColor Red
    } catch {
        Write-Host "Could not read error response content" -ForegroundColor Red
    }
}
