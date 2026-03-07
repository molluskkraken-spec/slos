# Simple HTTP Server Script for testing
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8000

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started at http://localhost:$port"
Write-Host "Press Ctrl+C to stop"

function Get-File {
    param([string]$filePath)
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        
        # Determine content type
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = switch ($ext) {
            ".html" { "text/html" }
            ".js" { "application/javascript" }
            ".css" { "text/css" }
            ".png" { "image/png" }
            ".jpg" { "image/jpeg" }
            ".json" { "application/json" }
            default { "text/plain" }
        }
        
        return @{
            statusCode = 200
            content = $content
            contentType = $contentType
        }
    }
    else {
        return @{
            statusCode = 404
            content = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            contentType = "text/html"
        }
    }
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    
    $filePath = Join-Path $scriptPath ($localPath.TrimStart('/').Replace('/', '\'))
    
    $result = Get-File $filePath
    
    $response.StatusCode = $result.statusCode
    $response.ContentType = $result.contentType
    $response.ContentLength64 = $result.content.Length
    $response.OutputStream.Write($result.content, 0, $result.content.Length)
    $response.Close()
}

$listener.Stop()
