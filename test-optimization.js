const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Quick test - optimize just a few images to demonstrate
async function quickTest() {
    const testImages = [
        'photos/mmhe/IMG_3799.jpeg',
        'photos/mmhe/IMG_3800.jpeg'
    ];
    
    const SIZES = {
        thumbnail: { width: 400, height: 300, quality: 75 },
        medium: { width: 800, height: 600, quality: 85 }
    };
    
    console.log('🖼️  Testing image optimization...\n');
    
    for (const imagePath of testImages) {
        if (!fs.existsSync(imagePath)) {
            console.log(`❌ Skipping ${imagePath} - file not found`);
            continue;
        }
        
        const stats = fs.statSync(imagePath);
        const originalSize = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`📸 Processing ${path.basename(imagePath)} (${originalSize}MB)`);
        
        const name = path.parse(imagePath).name;
        const dir = path.dirname(imagePath);
        
        try {
            // Apply auto-rotation based on EXIF orientation data
            const image = sharp(imagePath).rotate();
            
            // Create medium WebP version
            const mediumWebP = path.join(dir, `${name}_medium.webp`);
            await image
                .resize(SIZES.medium.width, SIZES.medium.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: SIZES.medium.quality })
                .toFile(mediumWebP);
            
            // Create medium JPEG version
            const mediumJPEG = path.join(dir, `${name}_medium.jpeg`);
            await image
                .resize(SIZES.medium.width, SIZES.medium.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: SIZES.medium.quality, progressive: true })
                .toFile(mediumJPEG);
            
            // Check new file sizes
            const webpStats = fs.statSync(mediumWebP);
            const jpegStats = fs.statSync(mediumJPEG);
            
            const webpSize = (webpStats.size / 1024).toFixed(0);
            const jpegSize = (jpegStats.size / 1024).toFixed(0);
            
            const webpSavings = (((stats.size - webpStats.size) / stats.size) * 100).toFixed(1);
            const jpegSavings = (((stats.size - jpegStats.size) / stats.size) * 100).toFixed(1);
            
            console.log(`  ✅ WebP: ${webpSize}KB (${webpSavings}% smaller)`);
            console.log(`  ✅ JPEG: ${jpegSize}KB (${jpegSavings}% smaller)`);
            console.log('');
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
    
    console.log('🎉 Test complete! Check the photos/mmhe/ folder for optimized images.');
}

quickTest();
