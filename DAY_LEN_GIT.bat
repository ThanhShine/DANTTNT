@echo off
chcp 65001 > nul
title DAY CODE LEN GITHUB
echo ============================================================
echo          DANG DAY TOAN BO DU AN LEN GITHUB
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Kiem tra trang thai git...
git status
echo.

echo [2/3] Gom toan bo file thay doi va tao commit neu co...
git add .
git commit -m "update: cap nhat du an Sales AI" 2>nul
echo.

echo [3/3] Dang day code len branch main...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo ============================================================
    echo   [THANH CONG] Toan bo du an da duoc day len GitHub!
    echo ============================================================
) else (
    echo ============================================================
    echo   [CANH BAO] Neu gap loi dang nhap, hay nhap vao trinh duyet
    echo   de xac nhan tai khoan GitHub cua ban.
    echo ============================================================
)

echo.
pause
