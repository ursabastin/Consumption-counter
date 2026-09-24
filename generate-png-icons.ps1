Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Grounded container (Indigo to Crimson gradient)
    $rect = New-Object System.Drawing.Rectangle 0, 0, ($size - 1), ($size - 1)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 225, 29, 72),   # #E11D48 Crimson Rose
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),   # #4F46E5 Grounded Indigo
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    
    # Draw background rounded squircle
    $corner = [int]($size * 0.24)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $corner * 2, $corner * 2, 180, 90)
    $path.AddArc($size - $corner * 2 - 1, 0, $corner * 2, $corner * 2, 270, 90)
    $path.AddArc($size - $corner * 2 - 1, $size - $corner * 2 - 1, $corner * 2, $corner * 2, 0, 90)
    $path.AddArc(0, $size - $corner * 2 - 1, $corner * 2, $corner * 2, 90, 90)
    $path.CloseFigure()

    $g.FillPath($gradBrush, $path)

    # Progress arc ring in crisp white
    $gaugePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 255, 255, 255), [Math]::Max(1.0, [float]($size * 0.075)))
    $dim = [float]($size * 0.72)
    $offset = [float](($size - $dim) / 2.0)
    $g.DrawArc($gaugePen, $offset, $offset, $dim, $dim, -40, 260)

    # Draw White Play Triangle in center
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $p1 = New-Object System.Drawing.PointF([float]($size * 0.43), [float]($size * 0.35))
    $p2 = New-Object System.Drawing.PointF([float]($size * 0.65), [float]($size * 0.50))
    $p3 = New-Object System.Drawing.PointF([float]($size * 0.43), [float]($size * 0.65))
    $g.FillPolygon($whiteBrush, @($p1, $p2, $p3))

    # Mint status indicator dot at corner if size >= 32
    if ($size -ge 32) {
        $badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 1.5)
        $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 5, 150, 105)) # Mint #059669
        $bx = [float]($size * 0.70)
        $by = [float]($size * 0.70)
        $bd = [float]($size * 0.22)
        $g.FillEllipse($badgeBrush, $bx, $by, $bd, $bd)
        $g.DrawEllipse($badgePen, $bx, $by, $bd, $bd)
    }

    $outPath = Join-Path $iconsDir "icon$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved $outPath"
}
