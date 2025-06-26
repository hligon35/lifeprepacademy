// Optimized JavaScript for Lifeprep Academy Foundation Website
// Performance-focused with progressive image loading

// Global variables for performance optimization
let imageCache = new Map();
let intersectionObserver = null;
let loadedImages = new Set();

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize performance monitoring
    performance.mark('app-start');
    
    // Initialize photos database
    initEventPhotos();
    
    // Load critical images first (above the fold)
    loadCriticalImages();
    
    // Initialize core functionality
    initSmoothScrolling();
    initMobileMenu();
    initFormValidation();
    initImageModal();
    initScrollAnimations();
    initLazyLoading();
    initAnalytics();
    initEventTabs();
    
    // Load default gallery with optimized images
    setTimeout(() => loadEventGallery('mmhe'), 100);
    
    // Prefetch other galleries in background after main content loads
    setTimeout(prefetchEventImages, 2000);
    
    performance.mark('app-ready');
    performance.measure('app-init', 'app-start', 'app-ready');
});

// Progressive image loading with WebP support
function createOptimizedImage(src, alt, sizes = 'medium', lazy = true) {
    const picture = document.createElement('picture');
    const baseName = src.replace(/\.(jpe?g|png)$/i, '');
    
    // WebP source (modern browsers)
    const webpSource = document.createElement('source');
    webpSource.srcset = `${baseName}_${sizes}.webp`;
    webpSource.type = 'image/webp';
    
    // JPEG fallback
    const img = document.createElement('img');
    img.src = lazy ? '' : `${baseName}_${sizes}.jpeg`;
    img.alt = alt;
    img.loading = lazy ? 'lazy' : 'eager';
    img.decoding = 'async';
    
    if (lazy) {
        img.dataset.src = `${baseName}_${sizes}.jpeg`;
        img.classList.add('lazy-image');
    }
    
    // Fallback to original if optimized version doesn't exist
    img.addEventListener('error', function() {
        if (!this.dataset.fallbackTried) {
            this.dataset.fallbackTried = 'true';
            this.src = src; // Use original image as fallback
        }
    });
    
    picture.appendChild(webpSource);
    picture.appendChild(img);
    
    return { picture, img };
}

// Load critical above-the-fold images immediately
function loadCriticalImages() {
    const heroImage = document.querySelector('.hero-section');
    const logo = document.querySelector('.logo img');
    
    // Preload hero background if not already cached
    if (heroImage) {
        const heroSrc = 'groupPhoto.avif';
        preloadImage(heroSrc);
    }
    
    // Optimize logo loading
    if (logo && !logo.complete) {
        logo.addEventListener('load', () => {
            logo.style.opacity = '1';
        });
    }
}

// Enhanced lazy loading with Intersection Observer
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadLazyImage(img);
                    intersectionObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
    }
}

function loadLazyImage(img) {
    if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.remove('lazy-image');
        img.classList.add('loaded');
        loadedImages.add(img.dataset.src);
    }
}

// Optimized event photo database with compressed images
function initEventPhotos() {
    // Store only essential data, load images progressively
    window.eventPhotos = {
        mmhe: generateImageList('mmhe', 54),
        discpan: generateImageList('discpan', 28),
        erf: generateImageList('erf', 10)
    };
}

function generateImageList(eventType, count) {
    const images = [];
    const basePath = `photos/${eventType}/`;
    
    // Different naming patterns for different events
    if (eventType === 'mmhe') {
        const imageNumbers = [3799, 3800, 3803, 3804, 3808, 3809, 3815, 3817, 3821, 3822, 3824, 3827, 3828, 3829, 3830, 3831, 3833, 3834, 3840, 3841, 3848, 3850, 3860, 3861, 3863, 3864, 3882, 3883, 3884, 3885, 3886, 3890, 3891, 3894, 3895, 3898, 3900, 3901, 3907, 3908, 3911, 3918, 3924, 3925, 3926, 3955, 3956, 3957, 3960, 3961, 3962, 3963, 3966, 3967];
        imageNumbers.forEach(num => {
            images.push(`${basePath}IMG_${num}.jpeg`);
        });
    } else if (eventType === 'discpan') {
        for (let i = 1; i <= count; i++) {
            images.push(`${basePath}${i}-_DSC${1394 + i}.jpg`);
        }
    } else if (eventType === 'erf') {
        const erfImages = ['FullSizeRender.jpeg', 'IMG_0883 2.jpeg', 'IMG_0883.jpeg', 'IMG_0884 2.jpeg', 'IMG_0884.jpeg', 'IMG_3636.jpeg', 'IMG_3640.jpeg', 'IMG_3641.jpeg', 'IMG_3646.jpeg', 'IMG_3647.jpeg'];
        erfImages.forEach(img => {
            images.push(`${basePath}${img}`);
        });
    }
    
    return images;
}

// Optimized gallery loading with progressive enhancement
function loadEventGallery(eventType) {
    const galleryContainer = document.querySelector(`#${eventType}-gallery .gallery-grid`);
    if (!galleryContainer) return;
    
    // Check if gallery is already loaded
    if (galleryContainer.dataset.loaded === 'true') return;
    
    performance.mark(`gallery-${eventType}-start`);
    
    // Show loading state
    galleryContainer.innerHTML = '<div class="gallery-loading">Loading photos...</div>';
    
    // Get photos for this event
    const photos = window.eventPhotos ? window.eventPhotos[eventType] : [];
    
    if (!photos || photos.length === 0) {
        showEmptyGalleryState(galleryContainer, eventType);
        return;
    }
    
    // Clear loading state
    galleryContainer.innerHTML = '';
    
    // Load images progressively - first 6 immediately, rest lazy
    const immediateLoad = 6;
    const fragment = document.createDocumentFragment();
    
    photos.forEach((photoUrl, index) => {
        const galleryItem = createGalleryItem(photoUrl, index, eventType, index < immediateLoad);
        fragment.appendChild(galleryItem);
    });
    
    galleryContainer.appendChild(fragment);
    
    // Mark as loaded
    galleryContainer.dataset.loaded = 'true';
    
    // Initialize lazy loading for remaining images
    const lazyImages = galleryContainer.querySelectorAll('.lazy-image');
    lazyImages.forEach(img => {
        if (intersectionObserver) {
            intersectionObserver.observe(img);
        } else {
            // Fallback for older browsers
            loadLazyImage(img);
        }
    });
    
    performance.mark(`gallery-${eventType}-end`);
    performance.measure(`gallery-${eventType}`, `gallery-${eventType}-start`, `gallery-${eventType}-end`);
}

function createGalleryItem(photoUrl, index, eventType, immediate = false) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.dataset.eventType = eventType;
    galleryItem.dataset.photoIndex = index;
    
    // Use optimized image creation
    const { picture, img } = createOptimizedImage(
        photoUrl, 
        `${getEventName(eventType)} - Photo ${index + 1}`,
        'medium',
        !immediate
    );
    
    // Create overlay for styling
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    
    const caption = document.createElement('div');
    caption.className = 'gallery-caption';
    caption.textContent = `${getEventName(eventType)} - Photo ${index + 1}`;
    
    overlay.appendChild(caption);
    
    // Error handling with better UX
    img.addEventListener('error', function() {
        galleryItem.innerHTML = createPlaceholderHTML(index);
        galleryItem.classList.add('placeholder');
    });
    
    // Click handler for modal
    img.addEventListener('load', function() {
        galleryItem.addEventListener('click', function() {
            openImageModal(photoUrl, img.alt, eventType, index);
        });
        
        // Add entrance animation
        if (!immediate) {
            galleryItem.classList.add('animate-in');
        }
    });
    
    galleryItem.appendChild(picture);
    galleryItem.appendChild(overlay);
    
    return galleryItem;
}

function createPlaceholderHTML(index) {
    return `
        <div class="gallery-placeholder">
            <div class="placeholder-content">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <h4>Photo ${index + 1}</h4>
                <p>Loading...</p>
            </div>
        </div>
    `;
}

function showEmptyGalleryState(container, eventType) {
    container.innerHTML = `
        <div class="gallery-empty">
            <h4>Coming Soon</h4>
            <p>Photos from ${getEventName(eventType)} will be available soon.</p>
        </div>
    `;
}

// Preload images in background
function preloadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    
    const img = new Image();
    const promise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });
    
    img.src = src;
    imageCache.set(src, promise);
    return promise;
}

// Background prefetching of other galleries
async function prefetchEventImages() {
    const events = ['discpan', 'erf'];
    
    for (const eventType of events) {
        const photos = window.eventPhotos[eventType] || [];
        
        // Prefetch only first few images of each gallery
        const prefetchCount = Math.min(3, photos.length);
        
        for (let i = 0; i < prefetchCount; i++) {
            const photoUrl = photos[i];
            const baseName = photoUrl.replace(/\.(jpe?g|png)$/i, '');
            
            try {
                // Prefetch WebP version first, then JPEG fallback
                await preloadImage(`${baseName}_medium.webp`).catch(() => 
                    preloadImage(`${baseName}_medium.jpeg`)
                );
            } catch (error) {
                // If optimized versions don't exist, try original
                preloadImage(photoUrl).catch(() => {
                    console.log(`Could not prefetch ${photoUrl}`);
                });
            }
        }
    }
}

// Optimized event tabs functionality
function initEventTabs() {
    const tabs = document.querySelectorAll('.event-tab');
    const contents = document.querySelectorAll('.event-details');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const eventType = this.dataset.event;
            
            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const targetContent = document.getElementById(`${eventType}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Load gallery only when tab is clicked
            requestAnimationFrame(() => {
                loadEventGallery(eventType);
            });
            
            // Track tab interaction
            trackEvent('tab_click', 'events', eventType);
        });
    });
}

function getEventName(eventType) {
    const names = {
        mmhe: "Men's Mental Health Expo",
        discpan: "Discussion Panel",
        erf: "Ed Reed Foundation"
    };
    return names[eventType] || eventType;
}

// Performance monitoring
function trackEvent(action, category, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            custom_map: { metric1: 'page_load_time' }
        });
    }
    
    // Also log to console in development
    console.log(`Event: ${action} | Category: ${category} | Label: ${label}`);
}

// Smooth scrolling optimization
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                updateActiveNavigation(this.getAttribute('href'));
            }
        });
    });
}

// Mobile menu optimization
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.setAttribute('aria-expanded', navMenu.classList.contains('active'));
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

function updateActiveNavigation(activeHref = null) {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    
    if (activeHref) {
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`nav a[href="${activeHref}"]`)?.classList.add('active');
        return;
    }

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Form validation (optimized version)
function initFormValidation() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const nameInput = contactForm.querySelector('#name');
    const emailInput = contactForm.querySelector('#email');
    const messageInput = contactForm.querySelector('#message');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        clearErrorMessages();

        // Validate all fields
        if (!validateField(nameInput, 'Name is required', (val) => val.trim().length >= 2)) isValid = false;
        if (!validateField(emailInput, 'Valid email is required', isValidEmail)) isValid = false;
        if (!validateField(messageInput, 'Message must be at least 10 characters', (val) => val.trim().length >= 10)) isValid = false;

        if (isValid) {
            showSuccessMessage('Thank you for your message! We\'ll get back to you soon.');
            contactForm.reset();
            trackEvent('form_submit', 'contact_form', 'success');
        } else {
            trackEvent('form_submit', 'contact_form', 'validation_error');
        }
    });
}

function validateField(field, message, validator) {
    const value = field.value.trim();
    if (!value || !validator(value)) {
        showError(field, message);
        return false;
    }
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc3545; font-size: 0.875rem; margin-top: 0.25rem;';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

function clearErrorMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(msg => msg.remove());
    document.querySelectorAll('input, textarea').forEach(field => field.style.borderColor = '');
}

function showSuccessMessage(message) {
    clearErrorMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        color: #28a745; font-weight: 600; margin-bottom: 1rem; padding: 1rem;
        background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 0.375rem;
    `;
    
    const form = document.querySelector('.contact-form');
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => successDiv.remove(), 5000);
}

// Optimized image modal
function initImageModal() {
    // Modal will be created dynamically when needed
}

function openImageModal(src, alt, eventType, index) {
    const modal = createImageModal();
    const modalImg = modal.querySelector('.modal-image');
    
    // Use optimized image in modal
    const baseName = src.replace(/\.(jpe?g|png)$/i, '');
    const optimizedSrc = `${baseName}_full.webp`;
    
    modalImg.src = optimizedSrc;
    modalImg.alt = alt;
    
    // Fallback to JPEG if WebP fails
    modalImg.addEventListener('error', function() {
        if (!this.dataset.fallbackTried) {
            this.dataset.fallbackTried = 'true';
            this.src = `${baseName}_full.jpeg`;
        }
    });
    
    // Final fallback to original
    modalImg.addEventListener('error', function() {
        if (!this.dataset.originalTried) {
            this.dataset.originalTried = 'true';
            this.src = src;
        }
    });
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    trackEvent('image_view', 'modal', src);
}

function createImageModal() {
    let modal = document.querySelector('.image-modal');
    if (modal) return modal;
    
    modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img class="modal-image" alt="">
        </div>
    `;
    
    modal.style.cssText = `
        display: none; position: fixed; z-index: 1000; left: 0; top: 0;
        width: 100%; height: 100%; background-color: rgba(0,0,0,0.9);
    `;
    
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        position: relative; margin: auto; display: block; width: 90%;
        max-width: 1200px; top: 50%; transform: translateY(-50%);
    `;
    
    const img = modal.querySelector('.modal-image');
    img.style.cssText = 'width: 100%; height: auto; border-radius: 8px;';
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        position: absolute; top: 15px; right: 35px; color: #f1f1f1;
        font-size: 40px; font-weight: bold; cursor: pointer;
    `;
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    document.body.appendChild(modal);
    return modal;
}

// Initialize scroll animations
function initScrollAnimations() {
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.program-card, .stat-item, .upcoming-event').forEach(el => {
            animationObserver.observe(el);
        });
    }
}

// Placeholder analytics function
function initAnalytics() {
    // Initialize analytics tracking
    console.log('Analytics initialized');
}
