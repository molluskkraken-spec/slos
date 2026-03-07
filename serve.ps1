param(
    [int]$port = 8000,
    [string]$path = (Get-Location).Path
)

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started at http://localhost:$port"
Write-Host "Serving files from: $path"
Write-Host "Press Ctrl+C to stop"

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
    
    $fullPath = Join-Path $path $localPath
    
    if (Test-Path $fullPath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $response.ContentLength64 = $bytes.Length
        
        if ($fullPath -like "*.html") { $response.ContentType = "text/html" }
        elseif ($fullPath -like "*.css") { $response.ContentType = "text/css" }
        elseif ($fullPath -like "*.js") { $response.ContentType = "application/javascript" }
        elseif ($fullPath -like "*.json") { $response.ContentType = "application/json" }
        elseif ($fullPath -like "*.png") { $response.ContentType = "image/png" }
        elseif ($fullPath -like "*.jpg") { $response.ContentType = "image/jpeg" }
        elseif ($fullPath -like "*.gif") { $response.ContentType = "image/gif" }
        
        $response.StatusCode = 200
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $response.ContentType = "text/plain"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    
    $response.OutputStream.Close()
    $response.Close()
}
