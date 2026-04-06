# GitHub Push Troubleshooting Guide

## Issue: 403 Forbidden Error

This error typically means authentication failed. Here are steps to fix it:

### Step 1: Create a New Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name like "BusTrack Push"
4. **Make sure to check these scopes:**
   - ✅ **repo** (Full control of private repositories)
   - ✅ **write:repo_hook**
5. Click **"Generate token"**
6. **📋 COPY the token immediately** (it will only show once!)

### Step 2: Try the Push Again

Option A - Interactive script (easier):
```powershell
cd C:\Users\admin\Desktop\bustrack
node github-push-interactive.js
```
Then follow the prompts and paste your new token.

Option B - With the token directly:
```powershell
cd C:\Users\admin\Desktop\bustrack
node push-to-github.js your_new_token_here
```

Option C - Manual Git Commands (if Git is installed):
```powershell
cd C:\Users\admin\Desktop\bustrack
git init
git add .
git commit -m "Initial commit: BusTrack real-time bus tracking"
git branch -M main
git remote add origin https://github.com/mdeeki0529-maker/bus-tracker.git
git push -u origin main
```
When prompted for password, paste your token.

## Verify Your Token Has Correct Permissions

1. Go to: https://github.com/settings/tokens
2. Find the token you're using
3. Check that it has the **"repo"** scope enabled
4. If not, create a new one with the correct scopes

## Still Having Issues?

- Make sure `https://github.com/mdeeki0529-maker/bus-tracker` exists on GitHub
- Verify you have write access to the repository
- Try creating the token again with all recommended scopes

## Repository URL to Use
```
https://github.com/mdeeki0529-maker/bus-tracker.git
```
