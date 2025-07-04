// Enhanced JavaScript for Lifeprep Academy Foundation Website

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize photos first for immediate loading
    initEventPhotos();
    
    // Load default gallery immediately
    loadEventGallery('mmhe');
    
    // Prefetch other images in background
    setTimeout(prefetchEventImages, 1000);
    
    // Initialize other functionality
    initSmoothScrolling();
    initMobileMenu();
    initFormValidation();
    initImageModal();
    initScrollAnimations();
    initLazyLoading();
    initAnalytics();
    initEventTabs();
    initKeyboardNavigation();
});

// Smooth scrolling for navigation links
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

                // Update active navigation
                updateActiveNavigation(this.getAttribute('href'));
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.setAttribute('aria-expanded', navMenu.classList.contains('active'));
        });

        // Close mobile menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Update active navigation based on scroll position
function updateActiveNavigation(activeHref = null) {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    
    if (activeHref) {
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        // Add active class to clicked link
        document.querySelector(`nav a[href="${activeHref}"]`)?.classList.add('active');
        return;
    }

    // Automatic navigation update based on scroll
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
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

// Enhanced form validation
function initFormValidation() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const nameInput = contactForm.querySelector('#name');
    const emailInput = contactForm.querySelector('#email');
    const messageInput = contactForm.querySelector('#message');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        const errors = [];

        // Clear previous error messages
        clearErrorMessages();

        // Validate name
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Name is required');
            isValid = false;
        } else if (nameInput.value.trim().length < 2) {
            showError(nameInput, 'Name must be at least 2 characters');
            isValid = false;
        }

        // Validate email
        if (!emailInput.value.trim()) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Validate message
        if (!messageInput.value.trim()) {
            showError(messageInput, 'Message is required');
            isValid = false;
        } else if (messageInput.value.trim().length < 10) {
            showError(messageInput, 'Message must be at least 10 characters');
            isValid = false;
        }

        if (isValid) {
            // Show success message
            showSuccessMessage('Thank you for your message! We\'ll get back to you soon.');
            contactForm.reset();
            
            // Track form submission
            trackEvent('form_submit', 'contact_form', 'success');
        } else {
            trackEvent('form_submit', 'contact_form', 'validation_error');
        }
    });

    // Real-time validation
    [nameInput, emailInput, messageInput].forEach(input => {
        if (input) {
            input.addEventListener('blur', function() {
                validateSingleField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        }
    });
}

function validateSingleField(field) {
    const value = field.value.trim();
    
    switch(field.type) {
        case 'text':
            if (field.id === 'name' && value.length > 0 && value.length < 2) {
                showError(field, 'Name must be at least 2 characters');
            }
            break;
        case 'email':
            if (value.length > 0 && !isValidEmail(value)) {
                showError(field, 'Please enter a valid email address');
            }
            break;
    }
    
    if (field.tagName === 'TEXTAREA' && value.length > 0 && value.length < 10) {
        showError(field, 'Message must be at least 10 characters');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '';
}

function clearErrorMessages() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('.success-message').forEach(success => success.remove());
}

function showSuccessMessage(message) {
    clearErrorMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.color = '#28a745';
    successDiv.style.fontWeight = '600';
    successDiv.style.marginBottom = '1rem';
    successDiv.style.padding = '1rem';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.border = '1px solid #c3e6cb';
    successDiv.style.borderRadius = '0.375rem';
    
    const form = document.querySelector('.contact-form');
    form.insertBefore(successDiv, form.firstChild);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Enhanced image modal/lightbox
function initImageModal() {
    const galleryImages = document.querySelectorAll('.event-gallery img, .hero-image');
    
    if (galleryImages.length === 0) return;

    // Create modal elements
    const modal = createModal();
    document.body.appendChild(modal);

    const modalImg = modal.querySelector('.modal-image');
    const closeBtn = modal.querySelector('.modal-close');
    const prevBtn = modal.querySelector('.modal-prev');
    const nextBtn = modal.querySelector('.modal-next');
    
    let currentImageIndex = 0;
    const images = Array.from(galleryImages);

    // Add click event to images
    galleryImages.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            currentImageIndex = index;
            openModal(this.src, this.alt);
        });
    });

    function openModal(src, alt) {
        modal.style.display = 'block';
        modalImg.src = src;
        modalImg.alt = alt;
        document.body.style.overflow = 'hidden';
        
        // Update navigation buttons
        updateNavigationButtons();
        
        trackEvent('image_view', 'modal', src);
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function updateNavigationButtons() {
        prevBtn.style.display = images.length > 1 ? 'block' : 'none';
        nextBtn.style.display = images.length > 1 ? 'block' : 'none';
    }

    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    
    prevBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        const prevImage = images[currentImageIndex];
        modalImg.src = prevImage.src;
        modalImg.alt = prevImage.alt;
    });
    
    nextBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        const nextImage = images[currentImageIndex];
        modalImg.src = nextImage.src;
        modalImg.alt = nextImage.alt;
    });

    // Close modal when clicking outside image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    prevBtn.click();
                    break;
                case 'ArrowRight':
                    nextBtn.click();
                    break;
            }
        }
    });
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img class="modal-image" src="" alt="">
            <button class="modal-nav modal-prev">&#10094;</button>
            <button class="modal-nav modal-next">&#10095;</button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .image-modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content {
            position: relative;
            margin: auto;
            display: block;
            width: 90%;
            max-width: 1200px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 90%;
            object-fit: contain;
        }
        
        .modal-close {
            position: absolute;
            top: 20px;
            right: 35px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2001;
        }
        
        .modal-close:hover {
            color: #ffd700;
        }
        
        .modal-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 16px;
            font-size: 18px;
            cursor: pointer;
            z-index: 2001;
        }
        
        .modal-prev {
            left: 20px;
        }
        
        .modal-next {
            right: 20px;
        }
        
        .modal-nav:hover {
            background-color: rgba(0,0,0,0.8);
        }
        
        @media (max-width: 768px) {
            .modal-close {
                top: 10px;
                right: 20px;
                font-size: 30px;
            }
            
            .modal-nav {
                padding: 12px;
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);
    
    return modal;
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Animate statistics counters
                if (entry.target.classList.contains('stat-item')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.program-card, .event-card, .stat-item, .impact-item, .testimonial').forEach(el => {
        observer.observe(el);
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .program-card, .event-card, .stat-item, .impact-item, .testimonial {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .program-card.animate-in, .event-card.animate-in, .stat-item.animate-in, 
        .impact-item.animate-in, .testimonial.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .stat-item.animate-in {
            animation: slideInUp 0.8s ease forwards;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

function animateCounter(element) {
    const numberElement = element.querySelector('.stat-number');
    if (!numberElement || numberElement.dataset.animated) return;
    
    const finalNumber = parseInt(numberElement.textContent.replace(/\D/g, ''));
    const duration = 2000;
    const increment = finalNumber / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= finalNumber) {
            current = finalNumber;
            clearInterval(timer);
        }
        
        const suffix = numberElement.textContent.includes('%') ? '%' : 
                      numberElement.textContent.includes('+') ? '+' : '';
        numberElement.textContent = Math.floor(current) + suffix;
    }, 16);
    
    numberElement.dataset.animated = 'true';
}

// Lazy loading for images
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        lazyImages.forEach(img => img.classList.add('loaded'));
    }
}

// Analytics and tracking
function initAnalytics() {
    // Track page load
    trackEvent('page_load', 'website', window.location.pathname);
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', debounce(() => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            if (maxScroll >= 25 && maxScroll < 50) {
                trackEvent('scroll_depth', '25_percent', maxScroll);
            } else if (maxScroll >= 50 && maxScroll < 75) {
                trackEvent('scroll_depth', '50_percent', maxScroll);
            } else if (maxScroll >= 75) {
                trackEvent('scroll_depth', '75_percent', maxScroll);
            }
        }
    }, 250));
    
    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            trackEvent('button_click', this.className, this.textContent.trim());
        });
    });
    
    // Track navigation updates
    window.addEventListener('scroll', debounce(updateActiveNavigation, 100));
}

function trackEvent(action, category, label) {
    // This would integrate with Google Analytics, Facebook Pixel, or other analytics
    console.log('Analytics Event:', { action, category, label });
    
    // Example integration with Google Analytics (if gtag is available)
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization
window.addEventListener('load', function() {
    // Remove loading classes and show content
    document.body.classList.add('loaded');
    
    // Preload critical images
    const criticalImages = ['logo.png', 'groupPhoto.avif'];
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', e.filename, e.message);
});

// Service Worker registration for improved performance (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

// Event Tabs Functionality
function initEventTabs() {
    const eventTabs = document.querySelectorAll('.event-tab');
    const eventDetails = document.querySelectorAll('.event-details');
    
    if (eventTabs.length === 0) return;
    
    // Initialize the photo arrays first
    initEventPhotos();
    
    eventTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const eventType = this.getAttribute('data-event');
            
            console.log('🔄 Switching to event tab:', eventType);
            
            // Remove active class from all tabs and details
            eventTabs.forEach(t => t.classList.remove('active'));
            eventDetails.forEach(d => d.classList.remove('active'));
            
            // Clear all gallery loaded states to force refresh
            document.querySelectorAll('.gallery-grid').forEach(grid => {
                grid.dataset.loaded = 'false';
            });
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(`${eventType}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Force load gallery
                setTimeout(() => {
                    loadEventGallery(eventType);
                }, 100);
            }
            
            // Track tab click
            trackEvent('event_tab_click', 'events', eventType);
        });
    });
    
    // Default gallery is already loaded in the main initialization
}

// Event Galleries Functionality
function initEventPhotos() {
    console.log('🎯 Initializing event photos...');
    
    // Define photo collections for each event using optimized medium-sized images
    window.eventPhotos = {
        mmhe: [
            'photos/mmhe/IMG_3799_medium.webp',
            'photos/mmhe/IMG_3800_medium.webp',
            'photos/mmhe/IMG_3803_medium.webp',
            'photos/mmhe/IMG_3804_medium.webp',
            'photos/mmhe/IMG_3808_medium.webp',
            'photos/mmhe/IMG_3809_medium.webp',
            'photos/mmhe/IMG_3815_medium.webp',
            'photos/mmhe/IMG_3817_medium.webp',
            'photos/mmhe/IMG_3821_medium.webp',
            'photos/mmhe/IMG_3822_medium.webp',
            'photos/mmhe/IMG_3824_medium.webp',
            'photos/mmhe/IMG_3827_medium.webp',
            'photos/mmhe/IMG_3828_medium.webp',
            'photos/mmhe/IMG_3829_medium.webp',
            'photos/mmhe/IMG_3830_medium.webp',
            'photos/mmhe/IMG_3831_medium.webp',
            'photos/mmhe/IMG_3833_medium.webp',
            'photos/mmhe/IMG_3834_medium.webp',
            'photos/mmhe/IMG_3840_medium.webp',
            'photos/mmhe/IMG_3841_medium.webp',
            'photos/mmhe/IMG_3848_medium.webp',
            'photos/mmhe/IMG_3850_medium.webp',
            'photos/mmhe/IMG_3860_medium.webp',
            'photos/mmhe/IMG_3861_medium.webp',
            'photos/mmhe/IMG_3863_medium.webp',
            'photos/mmhe/IMG_3864_medium.webp',
            'photos/mmhe/IMG_3882_medium.webp',
            'photos/mmhe/IMG_3883_medium.webp',
            'photos/mmhe/IMG_3884_medium.webp',
            'photos/mmhe/IMG_3885_medium.webp',
            'photos/mmhe/IMG_3886_medium.webp',
            'photos/mmhe/IMG_3890_medium.webp',
            'photos/mmhe/IMG_3891_medium.webp',
            'photos/mmhe/IMG_3894_medium.webp',
            'photos/mmhe/IMG_3895_medium.webp',
            'photos/mmhe/IMG_3898_medium.webp',
            'photos/mmhe/IMG_3900_medium.webp',
            'photos/mmhe/IMG_3901_medium.webp',
            'photos/mmhe/IMG_3907_medium.webp',
            'photos/mmhe/IMG_3908_medium.webp',
            'photos/mmhe/IMG_3911_medium.webp',
            'photos/mmhe/IMG_3918_medium.webp',
            'photos/mmhe/IMG_3924_medium.webp',
            'photos/mmhe/IMG_3925_medium.webp',
            'photos/mmhe/IMG_3926_medium.webp',
            'photos/mmhe/IMG_3955_medium.webp',
            'photos/mmhe/IMG_3956_medium.webp',
            'photos/mmhe/IMG_3957_medium.webp',
            'photos/mmhe/IMG_3960_medium.webp',
            'photos/mmhe/IMG_3961_medium.webp',
            'photos/mmhe/IMG_3962_medium.webp',
            'photos/mmhe/IMG_3963_medium.webp',
            'photos/mmhe/IMG_3966_medium.webp',
            'photos/mmhe/IMG_3967_medium.webp'
        ],
        discpan: [
            'photos/discpan/1-_DSC1395_medium.webp',
            'photos/discpan/2-_DSC1397_medium.webp',
            'photos/discpan/3-_DSC1398_medium.webp',
            'photos/discpan/4-_DSC1400_medium.webp',
            'photos/discpan/5-_DSC1401_medium.webp',
            'photos/discpan/6-_DSC1404_medium.webp',
            'photos/discpan/7-_DSC1405_medium.webp',
            'photos/discpan/8-_DSC1413_medium.webp',
            'photos/discpan/9-_DSC1415_medium.webp',
            'photos/discpan/10-_DSC1416_medium.webp',
            'photos/discpan/11-_DSC1418_medium.webp',
            'photos/discpan/12-_DSC1421_medium.webp',
            'photos/discpan/13-_DSC1422_medium.webp',
            'photos/discpan/14-_DSC1425_medium.webp',
            'photos/discpan/15-_DSC1428_medium.webp',
            'photos/discpan/16-_DSC1430_medium.webp',
            'photos/discpan/17-_DSC1433_medium.webp',
            'photos/discpan/18-_DSC1435_medium.webp',
            'photos/discpan/19-_DSC1438_medium.webp',
            'photos/discpan/20-_DSC1444_medium.webp',
            'photos/discpan/21-_DSC1446_medium.webp',
            'photos/discpan/22-_DSC1457_medium.webp',
            'photos/discpan/23-_DSC1459_medium.webp',
            'photos/discpan/24-_DSC1463_medium.webp',
            'photos/discpan/25-_DSC1474_medium.webp',
            'photos/discpan/26-_DSC1481_medium.webp',
            'photos/discpan/27-_DSC1493_medium.webp',
            'photos/discpan/28-_DSC1496_medium.webp'
        ],
        erf: [
            'photos/erf/FullSizeRender_medium.webp',
            'photos/erf/IMG_0883%202_medium.webp',
            'photos/erf/IMG_0883_medium.webp',
            'photos/erf/IMG_0884%202_medium.webp',
            'photos/erf/IMG_0884_medium.webp',
            'photos/erf/IMG_3636_medium.webp',
            'photos/erf/IMG_3640_medium.webp',
            'photos/erf/IMG_3641_medium.webp',
            'photos/erf/IMG_3646_medium.webp',
            'photos/erf/IMG_3647_medium.webp'
        ]
    };
    
    console.log('✅ Event photos initialized:', {
        mmhe: window.eventPhotos.mmhe.length,
        discpan: window.eventPhotos.discpan.length,
        erf: window.eventPhotos.erf.length
    });
}

function loadEventGallery(eventType) {
    const galleryContainer = document.querySelector(`#${eventType}-gallery .gallery-grid`);
    const paginationContainer = document.querySelector(`#${eventType}-pagination`);
    if (!galleryContainer) return;
    
    console.log('🖼️ Loading gallery for:', eventType);
    
    // Check if gallery is already loaded
    if (galleryContainer.dataset.loaded === 'true') {
        console.log('Gallery already loaded for:', eventType);
        return;
    }
    
    // Show loading state
    galleryContainer.innerHTML = '<div class="gallery-loading">Loading photos...</div>';
    
    // Get photos for this event
    const photos = window.eventPhotos ? window.eventPhotos[eventType] : [];
    
    console.log('Photos found for', eventType, ':', photos.length);
    console.log('First 3 photos:', photos.slice(0, 3));
    
    if (!photos || photos.length === 0) {
        // Show empty state
        galleryContainer.innerHTML = `
            <div class="gallery-empty">
                <h4>Coming Soon</h4>
                <p>Photos from this event will be available soon.</p>
            </div>
        `;
        return;
    }
    
    // Initialize pagination for this event
    initGalleryPagination(eventType, photos);
    
    // Mark as loaded
    galleryContainer.dataset.loaded = 'true';
}

// Gallery Pagination System
function initGalleryPagination(eventType, photos) {
    const PHOTOS_PER_PAGE = 9; // 3x3 grid
    const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
    
    // Initialize pagination state
    if (!window.galleryPagination) {
        window.galleryPagination = {};
    }
    
    window.galleryPagination[eventType] = {
        currentPage: 1,
        totalPages: totalPages,
        photos: photos,
        photosPerPage: PHOTOS_PER_PAGE
    };
    
    // Setup pagination controls
    setupPaginationControls(eventType);
    
    // Load first page
    loadGalleryPage(eventType, 1);
}

function setupPaginationControls(eventType) {
    const pagination = window.galleryPagination[eventType];
    const paginationContainer = document.querySelector(`#${eventType}-pagination`);
    const prevBtn = document.querySelector(`#${eventType}-prev`);
    const nextBtn = document.querySelector(`#${eventType}-next`);
    const pageInfo = document.querySelector(`#${eventType}-page-info`);
    
    if (!paginationContainer) return;
    
    // Show pagination if more than one page
    if (pagination.totalPages > 1) {
        paginationContainer.classList.remove('hidden');
        
        // Add keyboard shortcuts info
        addKeyboardShortcutsInfo(eventType);
    }
    
    // Update page info
    if (pageInfo) {
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    }
    
    // Setup button event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (pagination.currentPage > 1) {
                loadGalleryPage(eventType, pagination.currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (pagination.currentPage < pagination.totalPages) {
                loadGalleryPage(eventType, pagination.currentPage + 1);
            }
        });
    }
    
    // Update button states
    updatePaginationButtons(eventType);
}

function addKeyboardShortcutsInfo(eventType) {
    const galleryContainer = document.querySelector(`#${eventType}-gallery`);
    if (!galleryContainer) return;
    
    // Check if shortcuts info already exists
    if (galleryContainer.querySelector('.gallery-shortcuts')) return;
    
    const shortcutsDiv = document.createElement('div');
    shortcutsDiv.className = 'gallery-shortcuts';
    shortcutsDiv.innerHTML = `
        <strong>Keyboard shortcuts:</strong> 
        <kbd>←</kbd> Previous page · 
        <kbd>→</kbd> Next page · 
        <kbd>Home</kbd> First page · 
        <kbd>End</kbd> Last page
    `;
    
    galleryContainer.appendChild(shortcutsDiv);
}

function loadGalleryPage(eventType, pageNumber) {
    const pagination = window.galleryPagination[eventType];
    const galleryContainer = document.querySelector(`#${eventType}-gallery .gallery-grid`);
    
    if (!pagination || !galleryContainer) return;
    
    // Add transition effect
    galleryContainer.classList.add('page-transition');
    
    setTimeout(() => {
        // Update current page
        pagination.currentPage = pageNumber;
        
        // Calculate photo range for this page
        const startIndex = (pageNumber - 1) * pagination.photosPerPage;
        const endIndex = Math.min(startIndex + pagination.photosPerPage, pagination.photos.length);
        const pagePhotos = pagination.photos.slice(startIndex, endIndex);
        
        // Clear gallery
        galleryContainer.innerHTML = '';
        
        // Create gallery items for current page
        pagePhotos.forEach((photoUrl, index) => {
            const actualIndex = startIndex + index;
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.dataset.eventType = eventType;
            galleryItem.dataset.photoIndex = actualIndex;
            
            // Create picture element with WebP and JPEG fallback
            const picture = document.createElement('picture');
            
            // WebP source
            const webpSource = document.createElement('source');
            webpSource.srcset = photoUrl;
            webpSource.type = 'image/webp';
            
            // JPEG fallback
            const jpegSource = document.createElement('source');
            const jpegUrl = photoUrl.replace('_medium.webp', '_medium.jpeg');
            jpegSource.srcset = jpegUrl;
            jpegSource.type = 'image/jpeg';
            
            // Main img element (fallback)
            const img = document.createElement('img');
            img.src = jpegUrl; // Use JPEG as ultimate fallback
            img.alt = `${getEventName(eventType)} - Photo ${actualIndex + 1}`;
            img.loading = 'lazy';
            
            // Append sources to picture
            picture.appendChild(webpSource);
            picture.appendChild(jpegSource);
            picture.appendChild(img);
            
            // Create overlay for styling
            const overlay = document.createElement('div');
            overlay.className = 'gallery-overlay';
            
            const caption = document.createElement('div');
            caption.className = 'gallery-caption';
            caption.textContent = `Photo ${actualIndex + 1}`;
            
            overlay.appendChild(caption);
            
            img.addEventListener('error', function() {
                galleryItem.innerHTML = `
                    <div class="gallery-placeholder">
                        <div class="placeholder-content">
                            <h4>Photo ${actualIndex + 1}</h4>
                            <p>Image not available</p>
                        </div>
                    </div>
                `;
                galleryItem.classList.add('placeholder');
            });
            
            img.addEventListener('load', function() {
                galleryItem.addEventListener('click', function() {
                    openImageModal(photoUrl, img.alt, eventType, actualIndex);
                });
            });
            
            galleryItem.appendChild(picture);
            galleryItem.appendChild(overlay);
            galleryContainer.appendChild(galleryItem);
            
            // Add entrance animation
            galleryItem.classList.add('loading');
            setTimeout(() => {
                galleryItem.classList.remove('loading');
                galleryItem.classList.add('animate-in');
            }, index * 50);
        });
        
        // Remove transition effect and add loaded state
        galleryContainer.classList.remove('page-transition');
        galleryContainer.classList.add('page-loaded');
        
        // Update pagination controls
        updatePaginationButtons(eventType);
        updatePageInfo(eventType);
        
        // Re-initialize image modal for new images
        initGalleryImageModal();
        
        // Scroll gallery into view (smoothly)
        const gallerySection = document.querySelector(`#${eventType}-gallery`);
        if (gallerySection) {
            gallerySection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest'
            });
        }
    }, 150); // Small delay for smooth transition
}

function updatePaginationButtons(eventType) {
    const pagination = window.galleryPagination[eventType];
    const prevBtn = document.querySelector(`#${eventType}-prev`);
    const nextBtn = document.querySelector(`#${eventType}-next`);
    
    if (prevBtn) {
        prevBtn.disabled = pagination.currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = pagination.currentPage >= pagination.totalPages;
    }
}

function updatePageInfo(eventType) {
    const pagination = window.galleryPagination[eventType];
    const pageInfo = document.querySelector(`#${eventType}-page-info`);
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    }
}

function getEventName(eventType) {
    const names = {
        mmhe: "Men's Mental Health Expo",
        discpan: "Discussion Panel",
        erf: "Ed Reed Foundation"
    };
    return names[eventType] || eventType;
}

// Enhanced Image Modal for Gallery
function initGalleryImageModal() {
    // Remove existing modal if present
    const existingModal = document.querySelector('.gallery-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create new modal
    const modal = createGalleryModal();
    document.body.appendChild(modal);
    
    const modalImg = modal.querySelector('.modal-image');
    const modalCaption = modal.querySelector('.modal-caption');
    const closeBtn = modal.querySelector('.modal-close');
    const prevBtn = modal.querySelector('.modal-prev');
    const nextBtn = modal.querySelector('.modal-next');
    const counter = modal.querySelector('.modal-counter');
    
    let currentEvent = '';
    let currentIndex = 0;
    let currentPhotos = [];
    
    // Event listeners
    closeBtn.addEventListener('click', closeGalleryModal);
    prevBtn.addEventListener('click', showPreviousImage);
    nextBtn.addEventListener('click', showNextImage);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGalleryModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeGalleryModal();
                    break;
                case 'ArrowLeft':
                    showPreviousImage();
                    break;
                case 'ArrowRight':
                    showNextImage();
                    break;
            }
        }
    });
    
    function openImageModal(src, alt, eventType, index) {
        currentEvent = eventType;
        currentIndex = index;
        currentPhotos = window.eventPhotos[eventType] || [];
        
        modal.style.display = 'block';
        modalImg.src = src;
        modalImg.alt = alt;
        modalCaption.textContent = alt;
        updateCounter();
        updateNavigationButtons();
        document.body.style.overflow = 'hidden';
        
        trackEvent('gallery_image_view', 'events', `${eventType}_${index}`);
    }
    
    function closeGalleryModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function showPreviousImage() {
        if (currentPhotos.length <= 1) return;
        
        currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
        updateModalImage();
    }
    
    function showNextImage() {
        if (currentPhotos.length <= 1) return;
        
        currentIndex = (currentIndex + 1) % currentPhotos.length;
        updateModalImage();
    }
    
    function updateModalImage() {
        const newSrc = currentPhotos[currentIndex];
        const newAlt = `${getEventName(currentEvent)} - Photo ${currentIndex + 1}`;
        
        modalImg.src = newSrc;
        modalImg.alt = newAlt;
        modalCaption.textContent = newAlt;
        updateCounter();
    }
    
    function updateCounter() {
        if (counter && currentPhotos.length > 1) {
            counter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
            counter.style.display = 'block';
        } else if (counter) {
            counter.style.display = 'none';
        }
    }
    
    function updateNavigationButtons() {
        const hasMultipleImages = currentPhotos.length > 1;
        prevBtn.style.display = hasMultipleImages ? 'block' : 'none';
        nextBtn.style.display = hasMultipleImages ? 'block' : 'none';
    }
    
    // Make openImageModal globally accessible
    window.openImageModal = openImageModal;
}

function createGalleryModal() {
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img class="modal-image" src="" alt="">
            <div class="modal-caption"></div>
            <div class="modal-counter"></div>
            <button class="modal-nav modal-prev">&#10094;</button>
            <button class="modal-nav modal-next">&#10095;</button>
        </div>
    `;
    
    // Add styles for the gallery modal
    const style = document.createElement('style');
    style.textContent = `
        .gallery-modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.95);
            animation: fadeIn 0.3s ease;
        }
        
        .gallery-modal .modal-content {
            position: relative;
            margin: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 90%;
            max-width: 1200px;
            height: 100%;
            flex-direction: column;
        }
        
        .gallery-modal .modal-image {
            max-width: 90%;
            max-height: 80%;
            object-fit: contain;
            border-radius: 8px;
        }
        
        .modal-caption {
            color: white;
            text-align: center;
            margin-top: 1rem;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .modal-counter {
            color: white;
            text-align: center;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .gallery-modal .modal-close {
            position: absolute;
            top: 20px;
            right: 35px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2001;
            transition: color 0.3s ease;
        }
        
        .gallery-modal .modal-close:hover {
            color: var(--secondary-color);
        }
        
        .gallery-modal .modal-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 16px;
            font-size: 18px;
            cursor: pointer;
            z-index: 2001;
            border-radius: 4px;
            transition: background-color 0.3s ease;
        }
        
        .gallery-modal .modal-prev {
            left: 20px;
        }
        
        .gallery-modal .modal-next {
            right: 20px;
        }
        
        .gallery-modal .modal-nav:hover {
            background-color: rgba(0,0,0,0.8);
        }
        
        .gallery-placeholder {
            background-color: var(--background-light);
            border: 2px dashed var(--border-color);
            border-radius: var(--border-radius);
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-light);
        }
        
        .placeholder-content {
            text-align: center;
        }
        
        .placeholder-content h4 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }
        
        @media (max-width: 768px) {
            .gallery-modal .modal-close {
                top: 10px;
                right: 20px;
                font-size: 30px;
            }
            
            .gallery-modal .modal-nav {
                padding: 12px;
                font-size: 16px;
            }
            
            .gallery-modal .modal-image {
                max-height: 70%;
            }
        }
        
        .gallery-item.animate-in {
            animation: slideInUp 0.6s ease forwards;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    return modal;
}

// Prefetch remaining images for better performance
function prefetchEventImages() {
    if (!window.eventPhotos) return;
    
    // Prefetch remaining MMHE images (after first 6)
    const mmheImages = window.eventPhotos.mmhe.slice(6);
    mmheImages.forEach(imageUrl => {
        const img = new Image();
        img.src = imageUrl;
    });
    
    // Prefetch other event images
    ['discpan', 'erf'].forEach(eventType => {
        const images = window.eventPhotos[eventType];
        if (images) {
            images.forEach(imageUrl => {
                const img = new Image();
                img.src = imageUrl;
            });
        }
    });
}

// Initial prefetch
prefetchEventImages();

// Keyboard navigation for gallery pagination
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Only handle keyboard navigation when an event gallery is visible
        const activeEventTab = document.querySelector('.event-tab.active');
        if (!activeEventTab) return;
        
        const eventType = activeEventTab.dataset.event;
        const pagination = window.galleryPagination && window.galleryPagination[eventType];
        if (!pagination) return;
        
        // Left arrow or 'p' for previous page
        if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (pagination.currentPage > 1) {
                loadGalleryPage(eventType, pagination.currentPage - 1);
            }
        }
        
        // Right arrow or 'n' for next page
        if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (pagination.currentPage < pagination.totalPages) {
                loadGalleryPage(eventType, pagination.currentPage + 1);
            }
        }
        
        // Home key for first page
        if (e.key === 'Home' && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (pagination.currentPage > 1) {
                loadGalleryPage(eventType, 1);
            }
        }
        
        // End key for last page
        if (e.key === 'End' && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            if (pagination.currentPage < pagination.totalPages) {
                loadGalleryPage(eventType, pagination.totalPages);
            }
        }
    });
}

// Initialize keyboard navigation
initKeyboardNavigation();
