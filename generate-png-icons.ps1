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

    # 1. Grounded container (Indigo to Crimson gradient)
    $rect = New-Object System.Drawing.Rectangle 0, 0, ($size - 1), ($size - 1)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),   # #4F46E5 Grounded Indigo
        [System.Drawing.Color]::FromArgb(255, 225, 29, 72),   # #E11D48 Crimson Rose
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    
    # Rounded squircle path
    $corner = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $corner * 2, $corner * 2, 180, 90)
    $path.AddArc($size - $corner * 2 - 1, 0, $corner * 2, $corner * 2, 270, 90)
    $path.AddArc($size - $corner * 2 - 1, $size - $corner * 2 - 1, $corner * 2, $corner * 2, 0, 90)
    $path.AddArc(0, $size - $corner * 2 - 1, $corner * 2, $corner * 2, 90, 90)
    $path.CloseFigure()
    $g.FillPath($gradBrush, $path)

    # Center coordinates of the stopwatch
    $cx = [float]($size * 0.50)
    $cy = [float]($size * 0.52)
    $radius = [float]($size * 0.30)

    # 2. Stopwatch Top Crown / Button
    if ($size -ge 32) {
        $crownBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 255, 255, 255))
        $cw = [float]($size * 0.14)
        $ch = [float]($size * 0.07)
        $cxPos = [float]($cx - ($cw / 2.0))
        $cyPos = [float]($size * 0.10)
        $g.FillRectangle($crownBrush, $cxPos, $cyPos, $cw, $ch)
    }

    # 3. Outer Dial Ring Track (Subtle background ring)
    $trackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), [Math]::Max(1.0, [float]($size * 0.07)))
    $g.DrawEllipse($trackPen, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))

    # 4. Active Consumption Progress Arc (White counter arc)
    $arcWidth = [Math]::Max(1.5, [float]($size * 0.085))
    $arcPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(250, 255, 255, 255), $arcWidth)
    $arcPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arcPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($arcPen, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2), -90, 235)

    # 5. Timer / Clock Hands (Representing Time Consumption)
    $handWidth = [Math]::Max(1.2, [float]($size * 0.07))
    $handPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $handWidth)
    $handPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Hour hand pointing to 10 o'clock
    $hx = [float]($cx - ($radius * 0.52))
    $hy = [float]($cy - ($radius * 0.35))
    $g.DrawLine($handPen, $cx, $cy, $hx, $hy)

    # Minute hand pointing to 2 o'clock
    $mx = [float]($cx + ($radius * 0.58))
    $my = [float]($cy - ($radius * 0.45))
    $g.DrawLine($handPen, $cx, $cy, $mx, $my)

    # Center Pivot Dot
    $pivotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $pr = [Math]::Max(1.0, [float]($size * 0.065))
    $g.FillEllipse($pivotBrush, ($cx - $pr), ($cy - $pr), ($pr * 2), ($pr * 2))

    # 6. Live Active Indicator Dot at corner (Mint green, size >= 32)
    if ($size -ge 32) {
        $badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [Math]::Max(1.0, [float]($size * 0.035)))
        $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 5, 150, 105)) # Mint #059669
        $bd = [float]($size * 0.20)
        $bx = [float]($size * 0.72)
        $by = [float]($size * 0.72)
        $g.FillEllipse($badgeBrush, $bx, $by, $bd, $bd)
        $g.DrawEllipse($badgePen, $bx, $by, $bd, $bd)
    }

    $outPath = Join-Path $iconsDir "icon$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated unified icon: $outPath ($size x $size)"
}
