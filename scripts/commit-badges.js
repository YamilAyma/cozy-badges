const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==========================================
// COMMIT CONVENTIONS CONFIGURATION
// Configured with cozy gitmojis (✨ for additions, 🎨 for design optimizations)
// ==========================================
const COMMIT_CONVENTION = {
  add: (techName) => `✨ feat(badge): add ${techName} badge`,
  update: (techName) => `🎨 refactor(badge): optimize/update ${techName} badge`
};

const PROJECT_DIR = path.join(__dirname, '..');
const SVG_DIR = path.join(PROJECT_DIR, 'svg');
const TEMP_DIR = path.join(PROJECT_DIR, '.temp_commit_badges');
const SCRIPT_UPDATE = path.join(__dirname, 'update-readme.js');

// Exceptions map for technology capitalizations (loaded from exceptions.json)
const NAME_EXCEPTIONS = require('./exceptions.json');

function formatTechName(filename) {
  const baseName = path.basename(filename, '.svg').toLowerCase();
  if (NAME_EXCEPTIONS[baseName]) return NAME_EXCEPTIONS[baseName];
  return baseName
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get Git status for files in the svg/ directory
function getGitChanges() {
  try {
    const output = execSync('git status --porcelain svg/', { cwd: PROJECT_DIR, encoding: 'utf8' });
    if (!output.trim()) return [];
    
    return output.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Porcelain format: XY path or X "path"
        const status = line.substring(0, 2);
        let filePath = line.substring(3).trim();
        
        // Remove quotation marks if the name contains spaces
        if (filePath.startsWith('"') && filePath.endsWith('"')) {
          filePath = filePath.slice(1, -1);
        }
        
        return {
          status: status.trim(), // '??' (untracked), 'M' (modified), 'A' (added)
          filePath: filePath,
          fileName: path.basename(filePath)
        };
      })
      .filter(item => item.fileName.endsWith('.svg'));
  } catch (err) {
    console.error('⚠️ Git is not initialized or not accessible. Run `git init` first.');
    return [];
  }
}

// Runs a synchronous command in the project root directory
function runCmd(command) {
  try {
    return execSync(command, { cwd: PROJECT_DIR, encoding: 'utf8' }).trim();
  } catch (err) {
    console.error(`❌ Error running command: ${command}`);
    console.error(err.stderr || err.message);
    throw err;
  }
}

async function run() {
  console.log('🔍 Scanning Git status for uncommitted SVGs in "svg/"...\n');

  // Ensure we are inside a Git repository
  try {
    runCmd('git rev-parse --is-inside-work-tree');
  } catch (err) {
    console.log('⚠️ Initialize git first! Running "git init" and adding initial files...');
    runCmd('git init');
    // Commit package.json, scripts, etc., if not already committed
    runCmd('git add package.json package-lock.json scripts/ README.md CONTRIBUTING.md');
    runCmd('git commit -m "chore: initial project setup and pipeline tools"');
    console.log('✅ Git initialized and setup files committed.');
  }

  const changes = getGitChanges();

  if (changes.length === 0) {
    console.log('✨ No modified or new SVG badges found in "svg/". Nothing to commit.');
    return;
  }

  console.log(`📦 Found ${changes.length} SVG badge(s) to commit atomically:`);
  changes.forEach(c => console.log(`  - [${c.status}] ${c.fileName}`));
  console.log('\n🚀 Starting atomic commit sequence...\n');

  // Create temporary directory to store SVGs for sequential processing
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Temporarily move all detected files to the temporary folder
  changes.forEach(change => {
    const sourcePath = path.join(PROJECT_DIR, change.filePath);
    const destPath = path.join(TEMP_DIR, change.fileName);
    fs.renameSync(sourcePath, destPath);
  });

  // Process each file sequentially
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const techName = formatTechName(change.fileName);
    const tempPath = path.join(TEMP_DIR, change.fileName);
    const targetPath = path.join(SVG_DIR, change.fileName);

    console.log(`[${i + 1}/${changes.length}] Processing badge: ${techName}...`);

    // 1. Move the file back to svg/
    fs.renameSync(tempPath, targetPath);

    // 2. Run the SVG optimization and README.md update pipeline
    console.log('   Compiling and optimizing...');
    runCmd('node scripts/update-readme.js');

    // 3. Add changes to the Git staging area
    console.log('   Staging changes...');
    const relativeSvgPath = `svg/${change.fileName}`;
    runCmd(`git add "${relativeSvgPath}" README.md`);

    // 4. Determine the commit message
    const isNew = change.status === '??' || change.status === 'A';
    const commitMsg = isNew 
      ? COMMIT_CONVENTION.add(techName) 
      : COMMIT_CONVENTION.update(techName);

    // 5. Make the Git commit
    console.log(`   Committing: "${commitMsg}"`);
    runCmd(`git commit -m "${commitMsg}"`);
    console.log(`✅ Committed successfully.\n`);
  }

  // Clean up and remove the temporary directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmdirSync(TEMP_DIR);
  }

  console.log('🎉 Pipeline finished successfully!');
  console.log('All badges have been optimized, registered in the README.md(docs), and committed individually.');
}

run().catch(err => {
  console.error('❌ Pipeline failed:', err);
  // Attempt to restore files in case of a critical failure
  if (fs.existsSync(TEMP_DIR)) {
    const tempFiles = fs.readdirSync(TEMP_DIR);
    tempFiles.forEach(file => {
      try {
        fs.renameSync(path.join(TEMP_DIR, file), path.join(SVG_DIR, file));
      } catch (e) {}
    });
    try {
      fs.rmdirSync(TEMP_DIR);
    } catch (e) {}
    console.log('🛡️ Restored unsaved SVGs back to "svg/" from temporary folder.');
  }
});
