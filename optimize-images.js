const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Image optimization configuration
const SIZES = {
    thumbnail: { width: 400, height: 300, quality: 75 },
    medium: { width: 800, height: 600, quality: 85 },
    full: { width: 1200, height: 900, quality: 90 }
};

const FORMATS = ['webp', 'jpeg'];

async function optimizeImages() {
    const photosDir = './photos';
    const subdirs = ['mmhe', 'discpan', 'erf'];
    
    for (const subdir of subdirs) {
        const sourceDir = path.join(photosDir, subdir);
        
        if (!fs.existsSync(sourceDir)) {
            console.log(`Skipping ${subdir} - directory not found`);
            continue;
        }
        
        const files = fs.readdirSync(sourceDir)
            .filter(file => /\.(jpe?g|png|gif)$/i.test(file));
        
        console.log(`Processing ${files.length} images in ${subdir}...`);
        
        for (const file of files) {
            await processImage(sourceDir, file);
        }
    }

    // Additionally, process top-level flyer images in photos/ (flyer*.png|jpg)
    await processRootFlyers(photosDir);
}

async function processImage(sourceDir, filename) {
    const sourcePath = path.join(sourceDir, filename);
    const name = path.parse(filename).name;
    
    try {
        // Apply auto-rotation based on EXIF orientation data
        const image = sharp(sourcePath).rotate();
        const metadata = await image.metadata();
        
        console.log(`Processing ${filename} (${metadata.width}x${metadata.height}) - EXIF orientation: ${metadata.orientation || 'none'}`);
        
        // Create optimized versions for each size and format
        for (const [sizeName, config] of Object.entries(SIZES)) {
            for (const format of FORMATS) {
                const outputPath = path.join(
                    sourceDir, 
                    `${name}_${sizeName}.${format}`
                );
                
                await image
                    .resize(config.width, config.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(format, { 
                        quality: config.quality,
                        progressive: true 
                    })
                    .toFile(outputPath);
            }
        }
        
        console.log(`✓ Optimized ${filename} with correct orientation`);
        
    } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
    }
}

// Convert flyer*.png|jpg in photos root to WebP alongside original (no resize)
async function processRootFlyers(photosDir) {
    try {
        const entries = fs.readdirSync(photosDir).filter(f => /^(flyer\d*|flyer)\.(png|jpe?g)$/i.test(f));
        if (entries.length === 0) {
            console.log('No root flyer images detected for WebP conversion.');
            return;
        }
        console.log(`Converting ${entries.length} flyer image(s) to WebP...`);
        for (const file of entries) {
            const sourcePath = path.join(photosDir, file);
            const name = path.parse(file).name;
            const outPath = path.join(photosDir, `${name}.webp`);
            try {
                await sharp(sourcePath).rotate().webp({ quality: 82 }).toFile(outPath);
                console.log(`✓ Created ${path.basename(outPath)}`);
            } catch (e) {
                console.error(`Failed to convert ${file} -> WebP:`, e.message);
            }
        }
    } catch (e) {
        console.error('Error scanning root flyers:', e.message);
    }
}

// Run optimization
optimizeImages().then(() => {
    console.log('Image optimization complete!');
}).catch(error => {
    console.error('Optimization failed:', error);
});
