# Test DUPR API Edge Function script

# Get your anon key from the Supabase dashboard
$anonKey = "YOUR_ANON_KEY" # Replace with your actual anon key

$body = @{
    action = "testClientAuth"
} | ConvertTo-Json

try {
    # Send request to the Edge Function
    $response = Invoke-RestMethod `
        -Uri "https://eskjbzjhlbdrynotqtxz.supabase.co/functions/v1/dupr-api" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $body `
        -ErrorAction Stop
    
    # Display the response
    Write-Host "SUCCESS! Response:"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "ERROR: $_"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    
    # Try to get response content on error
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response content: $errorContent"
    }
    catch {
        Write-Host "Could not read error response content"
    }
}
