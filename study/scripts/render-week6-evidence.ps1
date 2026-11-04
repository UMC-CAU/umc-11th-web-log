$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$evidenceDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../docs/evidence'))
$records = (Get-Content -LiteralPath (Join-Path $evidenceDir 'http-records.json') -Raw -Encoding UTF8 | ConvertFrom-Json).records
$items = @(
    @{ Index = 0; Name = '01-signup-201.png' },
    @{ Index = 1; Name = '02-validation-400.png' },
    @{ Index = 4; Name = '03-rating-201.png' }
)
$font = New-Object System.Drawing.Font('Malgun Gothic', 14)
$titleFont = New-Object System.Drawing.Font('Malgun Gothic', 22, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font('Malgun Gothic', 11)
$ink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(25, 37, 58))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(75, 88, 110))
try {
    foreach ($item in $items) {
        $record = $records[$item.Index]
        $requestJson = $record.request | ConvertTo-Json -Depth 10
        $responseJson = $record.response | ConvertTo-Json -Depth 10
        $lines = @('REQUEST', ($record.method + ' ' + $record.url), 'Content-Type: application/json', '')
        $lines += ($requestJson -split '\r?\n')
        $lines += @('', ('RESPONSE  HTTP ' + $record.status), '')
        $lines += ($responseJson -split '\r?\n')
        $height = [Math]::Max(900, 170 + $lines.Count * 29)
        $bitmap = New-Object System.Drawing.Bitmap(1500, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
            $graphics.DrawString(('6주차 API 검증: ' + $record.label), $titleFont, $ink, 42, 30)
            $graphics.DrawString('실행 중인 Spring Boot demo / H2 서버에서 받은 실제 HTTP 응답', $smallFont, $muted, 44, 84)
            $graphics.DrawString('원본 http-records.json으로 생성한 보고서 이미지 (Postman 화면 캡처 아님)', $smallFont, $muted, 44, 111)
            $lineY = 160
            foreach ($line in $lines) {
                $graphics.DrawString([string]$line, $font, $ink, 44, $lineY)
                $lineY += 29
            }
            $bitmap.Save((Join-Path $evidenceDir $item.Name), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
} finally {
    $font.Dispose(); $titleFont.Dispose(); $smallFont.Dispose(); $ink.Dispose(); $muted.Dispose()
}
Write-Output 'API evidence reports exported: 3 PNG files'
