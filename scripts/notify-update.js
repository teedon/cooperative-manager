#!/usr/bin/env node

/**
 * Push Notification Script for Critical Updates
 * 
 * Usage:
 *   npm run notify-update -- --platform android --version 1.2.0 --force
 *   npm run notify-update -- --platform ios --version 1.2.0
 *   npm run notify-update -- --platform all --version 1.2.0 --force
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    platform: null,
    version: null,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) {
      parsed.platform = args[i + 1];
      i++;
    } else if (args[i] === '--version' && args[i + 1]) {
      parsed.version = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      parsed.force = true;
    }
  }

  return parsed;
}

async function login(apiUrl, email, password) {
  try {
    const response = await axios.post(`${apiUrl}/api/auth/login`, {
      email,
      password,
    });
    
    return response.data.accessToken;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
}

async function sendNotification(apiUrl, token, platform, version, forceUpdate) {
  try {
    const response = await axios.post(
      `${apiUrl}/api/downloads/notify-update/${platform}?version=${version}&forceUpdate=${forceUpdate}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error(`Notification failed: ${error.response?.data?.message || error.message}`);
  }
}

async function main() {
  console.log('🔔 Push Notification Tool for App Updates\n');

  const args = parseArgs();

  // Get platform
  let platform = args.platform;
  if (!platform) {
    platform = await question('Platform (android/ios/all): ');
  }

  if (!['android', 'ios', 'all'].includes(platform)) {
    console.error('Error: Platform must be android, ios, or all');
    rl.close();
    process.exit(1);
  }

  // Get version
  let version = args.version;
  if (!version) {
    version = await question('Version (e.g., 1.2.0): ');
  }

  if (!version) {
    console.error('Error: Version is required');
    rl.close();
    process.exit(1);
  }

  // Get force update flag
  let forceUpdate = args.force;
  if (!forceUpdate) {
    const forceInput = await question('Is this a critical/force update? (y/N): ');
    forceUpdate = forceInput.toLowerCase() === 'y';
  }

  // Get API URL
  const apiUrl = await question('API URL [http://localhost:3001]: ') || 'http://localhost:3001';

  // Get admin credentials
  console.log('\n🔐 Admin Authentication Required\n');
  const email = await question('Admin Email: ');
  const password = await question('Admin Password: ');

  console.log('\n📋 Summary:');
  console.log(`  Platform: ${platform}`);
  console.log(`  Version: ${version}`);
  console.log(`  Force Update: ${forceUpdate ? 'Yes' : 'No'}`);
  console.log(`  API URL: ${apiUrl}`);

  const confirm = await question('\nSend push notification? (Y/n): ');
  if (confirm.toLowerCase() === 'n') {
    console.log('Aborted.');
    rl.close();
    return;
  }

  try {
    console.log('\n🔄 Authenticating...');
    const token = await login(apiUrl, email, password);
    console.log('✓ Authenticated successfully');

    console.log('\n📤 Sending push notification...');
    const result = await sendNotification(apiUrl, token, platform, version, forceUpdate);

    if (result.success) {
      console.log('✅ Push notification sent successfully!');
      console.log(`\nDetails:`);
      console.log(`  Message: ${result.message}`);
      if (result.details) {
        console.log(`  Sent: ${result.details.sentCount}`);
        console.log(`  Failed: ${result.details.failedCount}`);
      }
    } else {
      console.error('❌ Failed to send notification');
      console.error(`  Message: ${result.message}`);
      if (result.details) {
        console.error(`  Error: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
