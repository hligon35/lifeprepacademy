# Photo Organization Guide

## Directory Structure

Your photos should be organized in the following folders:

### Men's Mental Health Expo
- **Folder**: `photos/mmhe/`
- **Files**: photo1.jpg, photo2.jpg, photo3.jpg, etc.
- **Description**: Photos from the Men's Mental Health Expo event

### Discussion Panel
- **Folder**: `photos/discpan/`
- **Files**: photo1.jpg, photo2.jpg, photo3.jpg, etc.
- **Description**: Photos from Discussion Panel events

### Ed Reed Foundation
- **Folder**: `photos/erf/`
- **Files**: photo1.jpg, photo2.jpg, photo3.jpg, etc.
- **Description**: Photos from Ed Reed Foundation partnership events

## Photo Requirements

### File Naming
- Use sequential naming: `photo1.jpg`, `photo2.jpg`, etc.
- Supported formats: .jpg, .jpeg, .png, .webp
- Keep filenames simple and consistent

### Image Specifications
- **Recommended size**: 1200px wide (will be automatically resized)
- **Aspect ratio**: 16:9 or 4:3 work best
- **File size**: Under 2MB for optimal loading
- **Quality**: High quality but web-optimized

### Adding New Photos

1. **Add photos to the appropriate folder**
2. **Update the JavaScript** in `script.js` if needed:
   ```javascript
   window.eventPhotos = {
       mmhe: [
           'photos/mmhe/photo1.jpg',
           'photos/mmhe/photo2.jpg',
           'photos/mmhe/photo3.jpg',
           // Add more photos here
       ],
       // ... other events
   };
   ```

3. **Test the gallery** to ensure photos load correctly

## Current Status

The photo directories are created and ready for your images. The website will:
- Show a "Coming Soon" message if no photos are found
- Display a loading animation while photos are being loaded
- Handle missing images gracefully with placeholder content

## Features

- **Responsive gallery** that works on all devices
- **Lightbox modal** for full-screen viewing
- **Keyboard navigation** (arrow keys, escape)
- **Image counter** showing current position
- **Smooth animations** and transitions
- **Error handling** for missing images
- **SEO-friendly** alt text and captions

## Tips

- Add photos gradually and test the gallery functionality
- Optimize images before uploading for better performance
- Consider adding captions or descriptions in the future
- Keep a backup of original high-resolution photos
