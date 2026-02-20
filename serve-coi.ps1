param(
    [int]$Port = 8000
)

$root = (Get-Location).Path
$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "COI server running at $prefix"
Write-Host "Root: $root"

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".wasm" = "application/wasm"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff2" = "font/woff2"
    ".ogg"  = "audio/ogg"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin")
        $response.Headers.Add("Cross-Origin-Embedder-Policy", "require-corp")
        $response.Headers.Add("Cross-Origin-Resource-Policy", "cross-origin")

        $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($relativePath)) {
            $relativePath = "index.html"
        }

        $targetPath = Join-Path $root $relativePath

        if ((Test-Path $targetPath) -and (Get-Item $targetPath).PSIsContainer) {
            $targetPath = Join-Path $targetPath "index.html"
        }

        if (-not (Test-Path $targetPath)) {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
            continue
        }

        $ext = [System.IO.Path]::GetExtension($targetPath).ToLowerInvariant()
        if ($mime.ContainsKey($ext)) {
            $response.ContentType = $mime[$ext]
        }

        $bytes = [System.IO.File]::ReadAllBytes($targetPath)
        $response.StatusCode = 200
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Close()
    }
    catch {
        if ($listener.IsListening) {
            Write-Host "Request error: $($_.Exception.Message)"
        }
    }
}
