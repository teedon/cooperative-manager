#!/usr/bin/env node

/**
 * Automated Version Bump Script
 * 
 * Usage:
 *   npm run bump-version patch    # 1.0.0 -> 1.0.1
 *   npm run bump-version minor    # 1.0.0 -> 1.1.0
 *   npm run bump-version major    # 1.0.0 -> 2.0.0
 *   npm run bump-version 1.2.3    # Set specific version
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function incrementVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Assume it's a specific version
      return type;
  }
}

async function updatePackageJson(newVersion) {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json: ${oldVersion} -> ${newVersion}`);
  
  return oldVersion;
}

async function updateAndroidBuildGradle(newVersion, buildNumber) {
  const gradlePath = path.join(__dirname, '../android/app/build.gradle');
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  
  // Update versionCode
  gradleContent = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${buildNumber}`
  );
  
  // Update versionName
  gradleContent = gradleContent.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${newVersion}"`
  );
  
  fs.writeFileSync(gradlePath, gradleContent);
  console.log(`✓ Updated android/app/build.gradle: versionCode ${buildNumber}, versionName "${newVersion}"`);
}

async function updateAppVersionsConfig(newVersion, buildNumber, platform, changelog) {
  const configPath = path.join(__dirname, '../backend/src/downloads/app-versions.config.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  const today = new Date().toISOString().split('T')[0];
  
  if (platform === 'android' || platform === 'both') {
    // Update Android version
    configContent = configContent.replace(
      /(android:\s*{[^}]*version:\s*)'[^']+'/,
      `$1'${newVersion}'`
    );
    configContent = configContent.replace(
      /(android:\s*{[^}]*buildNumber:\s*)\d+/,
      `$1${buildNumber}`
    );
    configContent = configContent.replace(
      /(android:\s*{[^}]*releaseDate:\s*)'[^']+'/,
      `$1'${today}'`
    );
    
    // Update changelog if provided
    if (changelog && changelog.length > 0) {
      const changelogStr = changelog.map(c => `'${c}'`).join(',\n      ');
      configContent = configContent.replace(
        /(android:\s*{[^}]*changeLog:\s*\[)[^\]]+(\])/s,
        `$1\n      ${changelogStr},\n    $2`
      );
    }
    
    console.log(`✓ Updated backend/src/downloads/app-versions.config.ts (Android)`);
  }
  
  if (platform === 'ios' || platform === 'both') {
    // Update iOS version
    configContent = configContent.replace(
      /(ios:\s*{[^}]*version:\s*)'[^']+'/,
      `$1'${newVersion}'`
    );
    configContent = configContent.replace(
      /(ios:\s*{[^}]*buildNumber:\s*)\d+/,
      `$1${buildNumber}`
    );
    configContent = configContent.replace(
      /(ios:\s*{[^}]*releaseDate:\s*)'[^']+'/,
      `$1'${today}'`
    );
    
    // Update changelog if provided
    if (changelog && changelog.length > 0) {
      const changelogStr = changelog.map(c => `'${c}'`).join(',\n      ');
      configContent = configContent.replace(
        /(ios:\s*{[^}]*changeLog:\s*\[)[^\]]+(\])/s,
        `$1\n      ${changelogStr},\n    $2`
      );
    }
    
    console.log(`✓ Updated backend/src/downloads/app-versions.config.ts (iOS)`);
  }
  
  fs.writeFileSync(configPath, configContent);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Please specify version bump type or version number');
    console.log('\nUsage:');
    console.log('  npm run bump-version patch    # 1.0.0 -> 1.0.1');
    console.log('  npm run bump-version minor    # 1.0.0 -> 1.1.0');
    console.log('  npm run bump-version major    # 1.0.0 -> 2.0.0');
    console.log('  npm run bump-version 1.2.3    # Set specific version');
    process.exit(1);
  }
  
  const bumpType = args[0];
  
  // Read current version
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Calculate new version
  const newVersion = incrementVersion(currentVersion, bumpType);
  
  console.log(`\n🚀 Version Bump Tool`);
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}\n`);
  
  // Get build number (increment from current)
  const gradlePath = path.join(__dirname, '../android/app/build.gradle');
  const gradleContent = fs.readFileSync(gradlePath, 'utf8');
  const currentBuildMatch = gradleContent.match(/versionCode\s+(\d+)/);
  const currentBuildNumber = currentBuildMatch ? parseInt(currentBuildMatch[1]) : 1;
  const newBuildNumber = currentBuildNumber + 1;
  
  console.log(`Build number: ${currentBuildNumber} -> ${newBuildNumber}\n`);
  
  // Ask for platform
  const platform = await question('Platform (android/ios/both) [both]: ') || 'both';
  
  // Ask for changelog
  console.log('\nEnter changelog items (one per line, empty line to finish):');
  const changelog = [];
  while (true) {
    const line = await question(`${changelog.length + 1}. `);
    if (!line.trim()) break;
    changelog.push(line.trim());
  }
  
  // Ask for force update
  const forceUpdateInput = await question('\nIs this a critical update? (y/N): ');
  const forceUpdate = forceUpdateInput.toLowerCase() === 'y';
  
  // Confirm
  console.log('\n📋 Summary:');
  console.log(`  Version: ${currentVersion} -> ${newVersion}`);
  console.log(`  Build: ${currentBuildNumber} -> ${newBuildNumber}`);
  console.log(`  Platform: ${platform}`);
  console.log(`  Force Update: ${forceUpdate ? 'Yes' : 'No'}`);
  if (changelog.length > 0) {
    console.log(`  Changelog:`);
    changelog.forEach((item, i) => console.log(`    ${i + 1}. ${item}`));
  }
  
  const confirm = await question('\nProceed with version bump? (Y/n): ');
  if (confirm.toLowerCase() === 'n') {
    console.log('Aborted.');
    rl.close();
    return;
  }
  
  console.log('\n📝 Updating files...\n');
  
  // Update all files
  await updatePackageJson(newVersion);
  await updateAndroidBuildGradle(newVersion, newBuildNumber);
  await updateAppVersionsConfig(newVersion, newBuildNumber, platform, changelog);
  
  // Update forceUpdate flag if needed
  if (forceUpdate) {
    const configPath = path.join(__dirname, '../backend/src/downloads/app-versions.config.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    if (platform === 'android' || platform === 'both') {
      configContent = configContent.replace(
        /(android:\s*{[^}]*forceUpdate:\s*)false/,
        `$1true`
      );
    }
    if (platform === 'ios' || platform === 'both') {
      configContent = configContent.replace(
        /(ios:\s*{[^}]*forceUpdate:\s*)false/,
        `$1true`
      );
    }
    
    fs.writeFileSync(configPath, configContent);
    console.log(`✓ Set forceUpdate to true for ${platform}`);
  }
  
  console.log('\n✅ Version bump complete!\n');
  console.log('Next steps:');
  console.log('  1. Build the app:');
  console.log('     npm run android:release  # For Android');
  console.log('     npm run ios:release      # For iOS');
  console.log('  2. Upload the build to the backend:');
  console.log('     See QUICK_START_UPDATES.md for instructions');
  if (forceUpdate) {
    console.log('  3. Send push notification for critical update:');
    console.log('     npm run notify-update -- --platform android --version ' + newVersion);
  }
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
