$lines = Get-Content 'src\components\SimulatePhase.jsx'
$part1 = $lines[0..741]
$part2 = $lines[1210..($lines.Length-1)]
$result = $part1 + $part2
$result | Set-Content 'src\components\SimulatePhase.jsx'
Write-Host "Done. Lines: $($result.Count)"
