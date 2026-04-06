const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const repoDir = process.cwd();
const githubUrl = 'https://github.com/mdeeki0529-maker/bus-tracker.git';
const author = {
  name: 'BusTrack Admin',
  email: 'admin@bustrack.com'
};

// Get GitHub token from environment or command line
const token = process.argv[2];

if (!token) {
  console.error('❌ GitHub Personal Access Token required!');
  console.error('Usage: node push-to-github.js <your-github-token>');
  console.error('\nTo get a token:');
  console.error('1. Go to https://github.com/settings/tokens');
  console.error('2. Click "Generate new token (classic)"');
  console.error('3. Check "repo" scope');
  console.error('4. Copy the token and pass it to this script');
  process.exit(1);
}

async function pushToGitHub() {
  try {
    console.log('🚀 Starting GitPush process...\n');

    // 1. Initialize git repository if not already done
    console.log('📦 Initializing git repository...');
    try {
      await git.init({ fs, dir: repoDir });
      console.log('✅ Repository initialized\n');
    } catch (e) {
      console.log('✅ Repository already exists\n');
    }

    // 2. Add all files
    console.log('📝 Adding files...');
    const files = getAllFiles(repoDir);
    
    for (const file of files) {
      const relPath = path.relative(repoDir, file);
      try {
        await git.add({ fs, dir: repoDir, filepath: relPath });
        console.log(`  ✓ Added: ${relPath}`);
      } catch (e) {
        // Skip errors for individual files
      }
    }
    console.log('✅ Files added\n');

    // 3. Create commit
    console.log('💾 Creating commit...');
    const commitHash = await git.commit({
      fs,
      dir: repoDir,
      author,
      message: 'Initial commit: BusTrack real-time bus tracking application\n\n- Full-stack application with real-time bus tracking\n- Driver and passenger interfaces\n- Socket.io integration for live location updates'
    });
    console.log(`✅ Commit created: ${commitHash}\n`);

    // 4. Add remote if not exists
    console.log('🔗 Setting up remote repository...');
    try {
      await git.addRemote({ fs, dir: repoDir, remote: 'origin', url: githubUrl });
      console.log('✅ Remote added\n');
    } catch (e) {
      console.log('✅ Remote already exists\n');
    }

    // 5. Create/checkout main branch
    console.log('🌿 Setting up main branch...');
    try {
      const branches = await git.listBranches({ fs, dir: repoDir });
      if (!branches.includes('main')) {
        await git.branch({ fs, dir: repoDir, ref: 'main' });
      }
      await git.checkout({ fs, dir: repoDir, ref: 'main' });
      console.log('✅ Main branch ready\n');
    } catch (e) {
      console.log('✅ Branch setup complete\n');
    }

    // 6. Push to GitHub
    console.log('⬆️  Pushing to GitHub...');
    await git.push({
      fs,
      http,
      dir: repoDir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: 'oauth2', password: token }),
      onAuthFailure: () => {
        throw new Error('Authentication failed. Please check your GitHub token.');
      }
    });

    console.log('✅ Pushed successfully!\n');
    console.log('🎉 Your project is now on GitHub!');
    console.log(`📍 Repository URL: ${githubUrl}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Ensure your GitHub Personal Access Token is valid');
    console.error('- Check that the repository exists on GitHub');
    console.error('- Verify you have permission to push to the repository');
    process.exit(1);
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules, .git, and other git files
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
