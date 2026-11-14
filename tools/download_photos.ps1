Set-Location "beyond-the-silent-machines"
$raw = Get-Content 'data/hardware-images.json' -Raw
$json = $raw | ConvertFrom-Json

foreach ($item in $json.items) {
    if ($item.status -eq 'source_verified' -and $item.image_remote) {
        $cleanMission = ($item.mission -replace '\W+', '-').ToLower()
        $folder = Join-Path 'assets/hardware' $cleanMission
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
        $id = if ($item.nasaId) { $item.nasaId } else { 'nasa' }
        $filename = "$($item.component)-$id.jpg"
        $dest = Join-Path $folder $filename
        Write-Host "Downloading $($item.mission) - $($item.component)..."
        & curl.exe -f -s -S -o $dest $item.image_remote
        if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 5000) {
            $item.image = $dest.Replace('\', '/')
            $item.status = 'locally_acquired'
            Write-Host "  OK: $dest"
        } else {
            Write-Host "  FAILED: $dest"
        }
    }
}

$json | ConvertTo-Json -Depth 10 | Set-Content 'data/hardware-images.json' -Encoding UTF8
Write-Host "Done!"

