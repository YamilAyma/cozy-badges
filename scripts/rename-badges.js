const fs = require('fs');
const path = require('path');

const SVG_DIR = path.join(__dirname, '..', 'svg');

// ==========================================
// MANUAL RENAME MAP FOR FIGMA DUPLICATED IDs
// Maps specific generic filenames to their correct technology names
// derived from their official Cozy Badges colors and vectors
// ==========================================
const MANUAL_RENAME = {
  'Badge-19.svg': 'gitlab.svg',
  'Badge-23.svg': 'vue.svg',
  'Badge-27.svg': 'bash.svg',
  'Badge-28.svg': 'assembly.svg',
  'Badge-30.svg': 'r.svg',
  'Badge-34.svg': 'go.svg',
  'Badge-36.svg': 'sql.svg',
  'Badge-39.svg': 'php.svg',
  'Badge-42.svg': 'ruby.svg',
  'Badge-44.svg': 'csharp.svg',
  'Badge-47.svg': 'rust.svg'
};

// ==========================================
// ICON TO TECHNOLOGY FILENAME MAP
// Normalizes the SVG icon IDs to standard, clean technology filenames
// ==========================================
const RENAME_MAP = {
  'supabase-fill': 'supabase',
  'deno-outline': 'deno',
  'java-line': 'java',
  'brand-bootstrap': 'bootstrap',
  'cplusplus': 'cpp',
  'apple-swift': 'swift',
  'logo-docker': 'docker',
  'kubernetes-worker-node': 'kubernetes',
  'html-5': 'html5',
  'css3-wordmark': 'css3',
  'next-16': 'nextjs',
  'openai-fill': 'openai',
  'github-line': 'github',
  'markdown-fill': 'markdown',
  'react-line': 'react',
  'js': 'javascript',
  'nest': 'nestjs',
  'logo-android': 'android',
  'mongodb-outline': 'mongodb',
  'language-lua': 'lua',
  'hugging-face': 'huggingface',
  'brand-react': 'react',
  'vue-logo': 'vue',
  'jupyter': 'jupyter-notebook'
};

async function run() {
  console.log('🔍 Scanning "svg/" directory for generic Badge SVGs...\n');

  if (!fs.existsSync(SVG_DIR)) {
    console.error('❌ svg/ directory not found!');
    return;
  }

  const files = fs.readdirSync(SVG_DIR).filter(file => file.startsWith('Badge') && file.endsWith('.svg'));

  if (files.length === 0) {
    console.log('✨ No generic "Badge*.svg" files found to rename.');
    return;
  }

  console.log(`📦 Found ${files.length} generic badge(s) to process.\n`);

  let renamedCount = 0;

  for (const file of files) {
    const filePath = path.join(SVG_DIR, file);
    
    // 1. Check if the file is in the manual rename map (handles Figma duplications)
    if (MANUAL_RENAME[file]) {
      const targetFileName = MANUAL_RENAME[file];
      const targetFilePath = path.join(SVG_DIR, targetFileName);
      
      console.log(`🏷️  Renaming (Manual Map): "${file}" ➔ "${targetFileName}"`);
      fs.renameSync(filePath, targetFilePath);
      renamedCount++;
      continue;
    }

    // 2. Otherwise, read file content and extract technology ID from the icon frame
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<g id="[^"]+:([^"]+)"/);

    if (match && match[1]) {
      const rawIconName = match[1].toLowerCase().trim();
      
      // Normalize name using our map or keep it as is
      let techName = RENAME_MAP[rawIconName] || rawIconName;
      
      // Clean up common variations if not explicitly mapped
      if (!RENAME_MAP[rawIconName]) {
        techName = techName
          .replace(/-logo$/, '')
          .replace(/-fill$/, '')
          .replace(/-outline$/, '')
          .replace(/-line$/, '');
      }

      const targetFileName = `${techName}.svg`;
      const targetFilePath = path.join(SVG_DIR, targetFileName);

      console.log(`🏷️  Renaming (Auto Extract): "${file}" ➔ "${targetFileName}" (extracted: "${rawIconName}")`);

      // Rename physical file
      fs.renameSync(filePath, targetFilePath);
      renamedCount++;
    } else {
      console.warn(`⚠️  Could not extract technology ID from: "${file}". Skipping.`);
    }
  }

  console.log(`\n🎉 Process finished! Successfully renamed ${renamedCount} file(s).`);
}

run().catch(err => {
  console.error('❌ Renaming pipeline failed:', err);
});
