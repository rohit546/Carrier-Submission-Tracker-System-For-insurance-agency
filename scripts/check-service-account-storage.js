// Script to check files owned by the service account
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkStorage() {
  try {
    // Load credentials
    const jsonPath = join(__dirname, '..', 'pdf-generator-477915-6056095f253b.json');
    const credentials = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    console.log('🔍 Checking storage for service account:', credentials.client_email);
    console.log('');
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // List all files owned by the service account
    console.log('📁 Files owned by service account:');
    console.log('─'.repeat(60));
    
    let pageToken = undefined;
    let totalFiles = 0;
    let totalSize = 0;
    
    do {
      const response = await drive.files.list({
        q: `'${credentials.client_email}' in owners`,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
        pageSize: 100,
        pageToken: pageToken,
      });
      
      if (response.data.files && response.data.files.length > 0) {
        for (const file of response.data.files) {
          totalFiles++;
          const size = file.size ? parseInt(file.size) : 0;
          totalSize += size;
          
          const sizeMB = (size / (1024 * 1024)).toFixed(2);
          const date = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'N/A';
          
          console.log(`  ${totalFiles}. ${file.name || '(Untitled)'}`);
          console.log(`     ID: ${file.id}`);
          console.log(`     Type: ${file.mimeType}`);
          console.log(`     Size: ${sizeMB} MB`);
          console.log(`     Modified: ${date}`);
          if (file.webViewLink) {
            console.log(`     Link: ${file.webViewLink}`);
          }
          console.log('');
        }
      }
      
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    
    console.log('─'.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Total size: ${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    console.log('');
    
    if (totalFiles === 0) {
      console.log('✅ No files found owned by service account.');
      console.log('   The storage quota issue might be at the Google Workspace domain level.');
    } else {
      console.log('💡 To free up space:');
      console.log('   1. Delete old/unnecessary files');
      console.log('   2. Or move files to a different account');
      console.log('   3. Or upgrade Google Workspace storage plan');
    }
    
    // Check quota/limits (if accessible)
    try {
      const about = await drive.about.get({
        fields: 'storageQuota, user',
      });
      
      if (about.data.storageQuota) {
        console.log('');
        console.log('📦 Storage Quota Information:');
        console.log('─'.repeat(60));
        
        if (about.data.storageQuota.limit) {
          const limitGB = (parseInt(about.data.storageQuota.limit) / (1024 * 1024 * 1024)).toFixed(2);
          console.log(`   Limit: ${limitGB} GB`);
        }
        
        if (about.data.storageQuota.usage) {
          const usageGB = (parseInt(about.data.storageQuota.usage) / (1024 * 1024 * 1024)).toFixed(2);
          console.log(`   Used: ${usageGB} GB`);
        }
        
        if (about.data.storageQuota.usageInDrive) {
          const driveUsageGB = (parseInt(about.data.storageQuota.usageInDrive) / (1024 * 1024 * 1024)).toFixed(2);
          console.log(`   Drive Usage: ${driveUsageGB} GB`);
        }
        
        if (about.data.storageQuota.limit && about.data.storageQuota.usage) {
          const limit = parseInt(about.data.storageQuota.limit);
          const usage = parseInt(about.data.storageQuota.usage);
          const percent = ((usage / limit) * 100).toFixed(1);
          console.log(`   Usage: ${percent}%`);
          
          if (percent >= 100) {
            console.log('   ⚠️  STORAGE FULL - This is why copies are failing!');
          } else if (percent >= 90) {
            console.log('   ⚠️  Storage almost full - consider freeing up space');
          }
        }
      }
    } catch (quotaError) {
      console.log('');
      console.log('⚠️  Could not retrieve quota information:', quotaError.message);
      console.log('   This might require admin access to view.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStorage();
