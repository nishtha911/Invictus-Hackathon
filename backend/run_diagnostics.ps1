# Run diagnostic and test check in PowerShell
cd "D:\visual studio\cognizant\final\Invictus-Hackathon\backend"

Write-Host "`n================================`nRunning RAG Diagnostic`n================================" -ForegroundColor Cyan
python.exe scripts/diagnose_rag.py

Write-Host "`n================================`nChecking Loan Advisor Recommendations`n================================" -ForegroundColor Cyan
python.exe scripts/check_recommendations.py
