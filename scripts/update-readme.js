const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

// ==========================================
// REPOSITORY CONFIGURATION
// ==========================================
const CONFIG = {
  githubUser: 'yamilayma',     
  githubRepo: 'cozy-badges',    
  branch: 'main',               
  columns: 3                    
};

// ==========================================
// NAME EXCEPTIONS CONFIGURATION
// Loaded from a separate JSON file so contributors don't have to touch JS code.
// Edit 'scripts/exceptions.json' to add new capitalization overrides.
// ==========================================
const NAME_EXCEPTIONS = require('./exceptions.json');

// Project paths
const SVG_DIR = path.join(__dirname, '..', 'svg');
const README_PATH = path.join(__dirname, '..', 'README.md');

// Formats the SVG filename to a readable technology title
function formatTechName(filename) {
  const baseName = path.basename(filename, '.svg').toLowerCase();
  
  // If it exists in the exceptions map, use it
  if (NAME_EXCEPTIONS[baseName]) {
    return NAME_EXCEPTIONS[baseName];
  }
  
  // Replace hyphens with spaces and capitalize each word
  return baseName
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Optimize individual SVG files using SVGO
function optimizeSVG(filePath, content) {
  try {
    const result = optimize(content, {
      path: filePath,
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              cleanupIds: true
            }
          }
        }
      ]
    });
    return result.data;
  } catch (error) {
    console.error(`⚠️ Error optimizing ${path.basename(filePath)}:`, error.message);
    return content;
  }
}

// Main function
async function run() {
  console.log('🚀 Starting badge optimization and update pipeline...\n');

  if (!fs.existsSync(SVG_DIR)) {
    console.log(`📁 Creating SVG directory at: ${SVG_DIR}`);
    fs.mkdirSync(SVG_DIR, { recursive: true });
  }

  // 1. Scan and optimize the SVGs
  const files = fs.readdirSync(SVG_DIR).filter(file => file.endsWith('.svg'));
  
  if (files.length === 0) {
    console.log('⚠️ No SVG files found in the "svg/" folder. Please place your .svg files there.');
    return;
  }

  console.log(`📦 Found ${files.length} SVG file(s). Optimizing...`);
  
  const badgesData = [];

  for (const file of files) {
    const filePath = path.join(SVG_DIR, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for raw/editable text (Outlines validation)
    // SVGs with outlined text will NOT contain <text> or <tspan> tags; instead, they use vector <path> tags.
    const hasRawText = originalContent.includes('<text') || originalContent.includes('<tspan');
    if (hasRawText) {
      console.warn(`\n⚠️  WARNING: "${file}" contains editable <text> or <tspan> elements!`);
      console.warn(`   To ensure consistency, please convert text to outlines in Figma (Ctrl+Shift+O / Cmd+Shift+O) and re-export.`);
    }

    // Optimize the SVG
    const optimizedContent = optimizeSVG(filePath, originalContent);
    
    // Save the optimized SVG back to disk
    fs.writeFileSync(filePath, optimizedContent, 'utf8');
    
    const techName = formatTechName(file);
    const cdnUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/${CONFIG.branch}/svg/${file}`;
    
    badgesData.push({
      fileName: file,
      techName: techName,
      localPath: `./svg/${file}`,
      cdnUrl: cdnUrl
    });
  }
  
  console.log('✅ All SVGs optimized successfully.');

  // Sort alphabetically by technology name
  badgesData.sort((a, b) => a.techName.localeCompare(b.techName));

  // 2. Generate the Markdown table
  console.log('📝 Generating badge table in Markdown...');
  let markdownTable = '| Badge | Technology | Usage Links |\n';
  markdownTable += '| :---: | :---: | :--- |\n';

  badgesData.forEach(badge => {
    // We use a relative path for the preview in the local repo README (100% portable)
    const preview = `<img src="${badge.localPath}" width="150" alt="${badge.techName}" />`;
    const markdownCode = `\`![${badge.techName}](${badge.cdnUrl})\``;
    const htmlCode = `\`<img src="${badge.cdnUrl}" alt="${badge.techName}" width="150" />\``;
    
    markdownTable += `| ${preview} | **${badge.techName}** | **Markdown:**<br>${markdownCode}<br><br>**HTML:**<br>${htmlCode} |\n`;
  });

  // 3. Update the README.md
  if (!fs.existsSync(README_PATH)) {
    console.log('⚠️ README.md not found. Creating an initial README...');
    const initialContent = `# Cute Badges\n\n<!-- START_BADGES -->\n<!-- END_BADGES -->\n`;
    fs.writeFileSync(README_PATH, initialContent, 'utf8');
  }

  let readmeContent = fs.readFileSync(README_PATH, 'utf8');
  
  const startTag = '<!-- START_BADGES -->';
  const endTag = '<!-- END_BADGES -->';
  
  const startIndex = readmeContent.indexOf(startTag);
  const endIndex = readmeContent.indexOf(endTag);

  if (startIndex === -1 || endIndex === -1) {
    console.error('❌ Error: Delimiters <!-- START_BADGES --> and <!-- END_BADGES --> not found in README.md');
    console.log('Please add these HTML comments in your README.md where you want the badge table to appear.');
    process.exit(1);
  }

  // Replace the section
  const beforeBadges = readmeContent.substring(0, startIndex + startTag.length);
  const afterBadges = readmeContent.substring(endIndex);
  
  const updatedReadmeContent = `${beforeBadges}\n\n${markdownTable}\n${afterBadges}`;
  
  fs.writeFileSync(README_PATH, updatedReadmeContent, 'utf8');
  console.log(`✨ README.md updated successfully! Listed ${badgesData.length} badge(s).`);
}

run().catch(err => {
  console.error('❌ An error occurred during script execution:', err);
});
