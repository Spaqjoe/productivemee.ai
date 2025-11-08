const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagePath = path.join(__dirname, '..', 'node_modules', '@tailwindcss', 'postcss');

if (!fs.existsSync(packagePath)) {
  console.log('Installing @tailwindcss/postcss...');
  try {
    const targetDir = path.join(__dirname, '..', 'node_modules', '@tailwindcss');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Download and extract the package
    const tmpDir = '/tmp';
    process.chdir(tmpDir);
    const packOutput = execSync('npm pack @tailwindcss/postcss@4.1.17', { encoding: 'utf-8' });
    const tgzFile = packOutput.trim().split('\n').find(line => line.endsWith('.tgz'));
    
    if (tgzFile) {
      const tgzPath = path.join(tmpDir, tgzFile);
      process.chdir(targetDir);
      execSync(`tar -xzf "${tgzPath}"`);
      if (fs.existsSync('package')) {
        fs.renameSync('package', 'postcss');
      }
      fs.unlinkSync(tgzPath);
      console.log('✅ @tailwindcss/postcss installed successfully');
    }
  } catch (error) {
    console.error('Error installing @tailwindcss/postcss:', error.message);
    process.exit(1);
  }
} else {
  console.log('@tailwindcss/postcss already installed');
}

