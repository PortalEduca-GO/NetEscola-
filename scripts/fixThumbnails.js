import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to test if a thumbnail URL is valid
async function testThumbnailUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Function to generate alternative thumbnail URLs for YouTube videos
function generateAlternativeThumbnails(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return [];
  
  return [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/default.jpg`
  ];
}

// Function to get fallback thumbnail
function getFallbackThumbnail() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzUuNSA2NUwxNTUuNSA4NUwxMzUuNSAxMDVWNjVaIiBmaWxsPSIjOTVBM0I3Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NUEzQjciPkltYWdlbSBJbmRpc3BvbsOtdmVsPC90ZXh0Pgo8L3N2Zz4=';
}

async function fixThumbnails() {
  const constantsPath = path.join(__dirname, '..', 'constants.ts');
  
  // Read the constants file
  let content = fs.readFileSync(constantsPath, 'utf8');
  
  // Extract all thumbnail URLs
  const thumbnailRegex = /thumbnailUrl:\s*"([^"]+)"/g;
  const matches = [...content.matchAll(thumbnailRegex)];
  
  console.log(`Found ${matches.length} thumbnail URLs to validate...`);
  
  let replacements = 0;
  
  for (const match of matches) {
    const originalUrl = match[1];
    console.log(`Testing: ${originalUrl}`);
    
    const isValid = await testThumbnailUrl(originalUrl);
    
    if (!isValid) {
      console.log(`❌ Invalid thumbnail: ${originalUrl}`);
      
      // Try to find the video URL for this entry
      const videoUrlMatch = content.match(new RegExp(
        `thumbnailUrl:\\s*"${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]+videoUrl:\\s*"([^"]+)"`,
        's'
      ));
      
      let replacementUrl = getFallbackThumbnail();
      
      if (videoUrlMatch) {
        const videoUrl = videoUrlMatch[1];
        const alternatives = generateAlternativeThumbnails(videoUrl);
        
        // Test alternative URLs
        for (const altUrl of alternatives) {
          const altValid = await testThumbnailUrl(altUrl);
          if (altValid) {
            replacementUrl = altUrl;
            console.log(`✅ Found working alternative: ${altUrl}`);
            break;
          }
        }
      }
      
      // Replace the thumbnail URL in the content
      content = content.replace(
        `thumbnailUrl: "${originalUrl}"`,
        `thumbnailUrl: "${replacementUrl}"`
      );
      
      replacements++;
    } else {
      console.log(`✅ Valid thumbnail: ${originalUrl}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (replacements > 0) {
    // Create backup
    const backupPath = constantsPath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(constantsPath));
    console.log(`📁 Backup created: ${backupPath}`);
    
    // Write the updated content
    fs.writeFileSync(constantsPath, content);
    console.log(`🔧 Fixed ${replacements} broken thumbnail URLs`);
  } else {
    console.log('✅ All thumbnail URLs are valid!');
  }
}

// Run the script
fixThumbnails().catch(console.error);
