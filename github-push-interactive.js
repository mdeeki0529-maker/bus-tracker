#!/usr/bin/env node

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const repoDir = process.cwd();
const githubUrl = 'https://github.com/mdeeki0529-maker/bus-tracker.git';
const author = {
  name: 'BusTrack Admin',
  email: 'admin@bustrack.com'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function pushToGitHub() {
  try {
    console.log('\n========================================');
    console.log('   BusTrack - GitHub Push Helper');
    console.log('========================================\n');

    // Get authentication method
    console.log('Authentication options:');
    console.log('1. Personal Access Token (PAT)');
    console.log('2. Get manual git commands\n');
    
    const choice = await question('Choose option (1 or 2): ');

    if (choice === '2') {
      showManualCommands();
      process.exit(0);
    }

    if (choice !== '1') {
      console.log('Invalid choice');
      process.exit(1);
    }

    const token = await question('\nEnter your GitHub Personal Access Token: ');

    if (!token || token.length < 20) {
      console.log('❌ Invalid token format');
      process.exit(1);
    }

    rl.close();

    console.log('\n🚀 Starting GitHub push...\n');

    // Initialize git repository
    console.log('📦 Initializing git repository...');
    try {
      await git.init({ fs, dir: repoDir });
      console.log('✅ Repository initialized\n');
    } catch (e) {
      console.log('✅ Repository already exists\n');
    }

    // Add all files
    console.log('📝 Adding files...');
    const files = getAllFiles(repoDir);
    
    for (const file of files) {
      const relPath = path.relative(repoDir, file);
      try {
        await git.add({ fs, dir: repoDir, filepath: relPath });
        console.log(`  ✓ ${relPath}`);
      } catch (e) {
        // Skip errors for individual files
      }
    }
    console.log('✅ Files added\n');

    // Create commit
    console.log('💾 Creating commit...');
    const commitHash = await git.commit({
      fs,
      dir: repoDir,
      author,
      message: 'Initial commit: BusTrack real-time bus tracking application'
    });
    console.log(`✅ Commit: ${commitHash}\n`);

    // Add remote
    console.log('🔗 Setting up remote...');
    try {
      await git.addRemote({ fs, dir: repoDir, remote: 'origin', url: githubUrl });
      console.log('✅ Remote added\n');
    } catch (e) {
      // Remote may already exist
    }

    // Create main branch
    console.log('🌿 Setting up main branch...');
    try {
      const branches = await git.listBranches({ fs, dir: repoDir });
      if (!branches.includes('main')) {
        await git.branch({ fs, dir: repoDir, ref: 'main' });
      }
      await git.checkout({ fs, dir: repoDir, ref: 'main' });
      console.log('✅ Main branch ready\n');
    } catch (e) {
      console.log('✅ Branch ready\n');
    }

    // Push to GitHub
    console.log('⬆️  Pushing to GitHub...');
    try {
      await git.push({
        fs,
        http,
        dir: repoDir,
        remote: 'origin',
        ref: 'main',
        onAuth: () => ({
          username: 'x-access-token',
          password: token
        })
      });
      
      console.log('✅ Pushed successfully!\n');
      console.log('🎉 SUCCESS! Your project is on GitHub!');
      console.log(`📍 Repository: https://github.com/mdeeki0529-maker/bus-tracker`);

    } catch (error) {
      if (error.message.includes('403')) {
        console.log('❌ Authentication failed (403 Forbidden)');
        console.log('\nPossible causes:');
        console.log('- Token has expired');
        console.log('- Token lacks "repo" scope');
        console.log('- Token was revoked');
        console.log('\nCreate a new token at: https://github.com/settings/tokens');
      } else if (error.message.includes('404')) {
        console.log('❌ Repository not found (404)');
        console.log('Make sure the repository exists on GitHub:');
        console.log('https://github.com/mdeeki0529-maker/bus-tracker');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function showManualCommands() {
  console.log('\n========================================');
  console.log('   Manual Git Commands');
  console.log('========================================\n');
  
  console.log('If you have Git installed, run these commands:\n');
  console.log('PowerShell:');
  console.log('  cd "C:\\Users\\admin\\Desktop\\bustrack"');
  console.log('  git init');
  console.log('  git add .');
  console.log('  git commit -m "Initial commit: BusTrack real-time bus tracking"');
  console.log('  git branch -M main');
  console.log('  git remote add origin https://github.com/mdeeki0529-maker/bus-tracker.git');
  console.log('  git push -u origin main\n');
  
  console.log('When prompted for password, use your GitHub Personal Access Token.');
  console.log('Get a token: https://github.com/settings/tokens\n');
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules and git directories
    if (file === 'node_modules' || file.startsWith('.git') || file === '.DS_Store') {
      return;
    }

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

pushToGitHub();
