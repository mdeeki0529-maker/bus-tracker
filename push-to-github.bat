@echo off
REM BusTrack Git Push Script
REM This script initializes git, commits, and pushes to GitHub

echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Creating initial commit...
git commit -m "Initial commit: BusTrack real-time bus tracking application"

echo Adding remote repository...
git remote add origin https://github.com/mdeeki0529-maker/bus-tracker.git

echo Pushing to GitHub (main branch)...
git branch -M main
git push -u origin main

echo Done! Your project has been pushed to GitHub.
pause
