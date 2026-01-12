// Test script to verify Google Sheets API access
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testAccess() {
  try {
    // Load credentials
    const jsonPath = join(__dirname, '..', 'pdf-generator-477915-6056095f253b.json');
    const credentials = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    console.log('✓ Credentials loaded');
    console.log('  Service Account:', credentials.client_email);
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive', // Full Drive scope for Workspace files
      ],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const TEMPLATE_SPREADSHEET_ID = '1XyIgmjERyh9yTni6ZuoEpIc7rwGU4bQooMlQG1S57sI';
    const DESTINATION_FOLDER_ID = '1Ymt9O6_CyvCN71VEyMyXrF6kHRaRMOcG';
    
    // Test 0: Check destination folder access
    console.log('\n📁 Test 0: Checking destination folder access...');
    try {
      const folderInfo = await drive.files.get({
        fileId: DESTINATION_FOLDER_ID,
        fields: 'id, name, mimeType, permissions',
      });
      console.log('✓ Destination folder accessible!');
      console.log('  Name:', folderInfo.data.name);
      console.log('  Type:', folderInfo.data.mimeType);
      console.log('  Permissions:', folderInfo.data.permissions?.length || 0, 'permissions found');
    } catch (error) {
      console.log('✗ Destination Folder Error:', error.message);
      if (error.code === 404) {
        console.log('  → Folder not found. Service account does NOT have access to this folder.');
        console.log('  → Please share the folder with:', credentials.client_email);
      } else if (error.code === 403) {
        console.log('  → Permission denied. Service account needs "Editor" access to the folder.');
      }
    }
    
    // Test 1: Try to get file metadata from Drive
    console.log('\n📋 Test 1: Checking Drive API access...');
    try {
      const fileInfo = await drive.files.get({
        fileId: TEMPLATE_SPREADSHEET_ID,
        fields: 'id, name, mimeType, permissions',
      });
      console.log('✓ Drive API: File found!');
      console.log('  Name:', fileInfo.data.name);
      console.log('  Type:', fileInfo.data.mimeType);
      console.log('  Permissions:', fileInfo.data.permissions?.length || 0, 'permissions found');
    } catch (error) {
      console.log('✗ Drive API Error:', error.message);
      if (error.code === 404) {
        console.log('  → File not found. Service account does NOT have access to this file.');
        console.log('  → Please share the file with:', credentials.client_email);
      } else if (error.code === 403) {
        console.log('  → Permission denied. Service account needs "Editor" access.');
      }
    }
    
    // Test 2: Try to read from Sheets API
    console.log('\n📊 Test 2: Checking Sheets API access...');
    try {
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: TEMPLATE_SPREADSHEET_ID,
      });
      console.log('✓ Sheets API: Access granted!');
      console.log('  Title:', sheetInfo.data.properties?.title);
      console.log('  Sheets:', sheetInfo.data.sheets?.length || 0, 'sheets found');
    } catch (error) {
      console.log('✗ Sheets API Error:', error.message);
      if (error.code === 404) {
        console.log('  → Spreadsheet not found. Service account does NOT have access.');
      } else if (error.code === 403) {
        console.log('  → Permission denied.');
      }
    }
    
    // Test 3: Try to copy (this is what the actual code does)
    console.log('\n📋 Test 3: Testing copy operation to Rohit\'s folder...');
    try {
      const copyResponse = await drive.files.copy({
        fileId: TEMPLATE_SPREADSHEET_ID,
        requestBody: {
          name: 'TEST COPY - DELETE ME',
          parents: [DESTINATION_FOLDER_ID], // Copy to Rohit's folder
        },
      });
      console.log('✓ Copy successful!');
      console.log('  New file ID:', copyResponse.data.id);
      console.log('  New file URL:', `https://docs.google.com/spreadsheets/d/${copyResponse.data.id}/edit`);
      
      // Clean up - delete the test file
      await drive.files.delete({ fileId: copyResponse.data.id });
      console.log('  ✓ Test file deleted');
    } catch (error) {
      console.log('✗ Copy Error:', error.message);
      if (error.code === 404) {
        console.log('  → Cannot copy: File not found. Service account needs access.');
      } else if (error.code === 403) {
        console.log('  → Cannot copy: Permission denied.');
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

testAccess();
