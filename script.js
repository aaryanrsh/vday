// State management
let currentPhotoIndex = 0;
const totalPhotos = 20;
const photos = [];
let placedPhotos = []; // Track placed photos for collision detection
let isSoundOn = true;
let videoStream = null;

// DOM elements
const wallContainer = document.getElementById('wallContainer');
const snapButton = document.getElementById('snapButton');
const note = document.getElementById('note');
const backgroundMusic = document.getElementById('backgroundMusic');
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');
const polaroidCamera = document.getElementById('polaroidCamera');
const selfieCapture = document.getElementById('selfieCapture');
const videoPreview = document.getElementById('videoPreview');
const captureCanvas = document.getElementById('captureCanvas');
const captureButton = document.getElementById('captureButton');
const cancelButton = document.getElementById('cancelButton');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    preloadPhotos();
    setupEventListeners();
    
    // Auto-play music on page load
    autoPlayMusic();
});

// Preload all photos for smooth experience
function preloadPhotos() {
    for (let i = 1; i <= totalPhotos; i++) {
        const img = new Image();
        img.src = `photos/photo${i}.jpg`;
        photos.push(img);
    }
}

// Setup event listeners
function setupEventListeners() {
    if (snapButton) {
        snapButton.addEventListener('click', handleSnap);
        console.log('Snap button event listener added');
    } else {
        console.error('Snap button not found!');
    }
    
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }
    
    if (captureButton) {
        captureButton.addEventListener('click', captureSelfie);
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', cancelSelfie);
    }
}

// Auto-play music
function autoPlayMusic() {
    if (backgroundMusic) {
        backgroundMusic.volume = 0.5; // Set volume to 50%
        
        // Try to play immediately
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Autoplay was prevented - try on any user interaction
                const playOnInteraction = () => {
                    if (isSoundOn && backgroundMusic.paused) {
                        backgroundMusic.play().catch(() => {});
                    }
                };
                
                // Try on multiple interaction types
                document.addEventListener('click', playOnInteraction, { once: true });
                document.addEventListener('touchstart', playOnInteraction, { once: true });
                document.addEventListener('keydown', playOnInteraction, { once: true });
                document.addEventListener('mousemove', playOnInteraction, { once: true });
            });
        }
    }
}

// Toggle sound on/off
function toggleSound() {
    isSoundOn = !isSoundOn;
    
    if (isSoundOn) {
        backgroundMusic.play().catch(err => {
            console.log('Could not play music:', err);
        });
        soundIcon.textContent = '🔊';
    } else {
        backgroundMusic.pause();
        soundIcon.textContent = '🔇';
    }
}

// Handle snap button click
function handleSnap() {
    if (currentPhotoIndex >= totalPhotos) {
        return;
    }

    const photoIndex = currentPhotoIndex;
    currentPhotoIndex++;

    try {
        // Get final position for the photo
        const position = getRandomPosition(null, 250, 300);
        
        if (!position) {
            console.error('Failed to get position for photo');
            return;
        }
        
        // Create photo element
        const photoWrapper = createPhotoElement(photoIndex);
        
        // Set final position as CSS variables for animation
        // Photo will start in center, then animate to final position
        photoWrapper.style.setProperty('--final-x', position.x + 'px');
        photoWrapper.style.setProperty('--final-y', position.y + 'px');
        photoWrapper.style.setProperty('--rotation', position.rotation + 'deg');
        
        // Initially position in center (animation will handle the movement)
        photoWrapper.style.left = '50%';
        photoWrapper.style.top = '50%';
        
        // Add to wall container
        wallContainer.appendChild(photoWrapper);
        
        // Track position after animation completes
        setTimeout(() => {
            placedPhotos.push({
                element: photoWrapper,
                x: position.x,
                y: position.y,
                width: 250,
                height: 300
            });
        }, 1500);

        // Check if all photos are shown
        if (currentPhotoIndex >= totalPhotos) {
            setTimeout(() => {
                showNote();
            }, 500);
        }
    } catch (error) {
        console.error('Error handling snap:', error);
    }
}

// Create photo element with Polaroid styling
function createPhotoElement(index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-wrapper';
    
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';
    
    const img = document.createElement('img');
    const photoNum = index + 1;
    const extensions = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'];
    let extensionIndex = 0;
    
    // Try to load with different extensions
    function tryLoadImage() {
        if (extensionIndex < extensions.length) {
            img.src = `photos/photo${photoNum}.${extensions[extensionIndex]}`;
            extensionIndex++;
        } else {
            console.warn(`Photo ${photoNum} not found with any extension`);
            img.style.display = 'none';
        }
    }
    
    img.onerror = tryLoadImage;
    img.alt = `Photo ${photoNum}`;
    
    // Start with first extension
    tryLoadImage();
    
    polaroid.appendChild(img);
    wrapper.appendChild(polaroid);
    
    return wrapper;
}

// Get random position on wall (with collision detection)
function getRandomPosition(element, width = 250, height = 300) {
    const maxAttempts = 50;
    let attempts = 0;
    
    // Camera area exclusion (center of screen) - responsive
    const isMobile = window.innerWidth <= 768;
    const cameraWidth = isMobile ? Math.min(240, window.innerWidth * 0.7) : 320;
    const cameraHeight = isMobile ? Math.min(210, window.innerHeight * 0.3) : 280;
    const cameraCenterX = window.innerWidth / 2;
    const cameraCenterY = window.innerHeight / 2;
    const cameraLeft = cameraCenterX - cameraWidth / 2;
    const cameraRight = cameraCenterX + cameraWidth / 2;
    const cameraTop = cameraCenterY - cameraHeight / 2;
    const cameraBottom = cameraCenterY + cameraHeight / 2;
    const cameraExclusionMargin = 60; // Extra margin around camera to prevent photos behind it
    
    while (attempts < maxAttempts) {
        const padding = 20;
        const headingHeight = window.innerWidth <= 480 ? 70 : 100;
        
        const maxX = window.innerWidth - width - padding;
        const maxY = window.innerHeight - height - padding;
        
        // Allow photos to be placed from top (after heading) to bottom
        const minY = padding + headingHeight;
        const availableHeight = maxY - minY;
        
        // Prioritize top and bottom areas, avoid middle (where camera is)
        // 45% top, 10% middle, 45% bottom
        const zone = Math.random();
        let y;
        if (zone < 0.45) {
            // Top area - use the space where note appears
            y = minY + Math.random() * (availableHeight * 0.4);
        } else if (zone < 0.55) {
            // Middle area (small chance, but avoid camera center)
            y = minY + (availableHeight * 0.4) + Math.random() * (availableHeight * 0.2);
        } else {
            // Bottom area
            y = minY + (availableHeight * 0.6) + Math.random() * (availableHeight * 0.4);
        }
        
        const x = Math.random() * maxX + padding;
        const rotation = (Math.random() - 0.5) * 10; // -5 to +5 degrees
        
        // Check if position is in camera exclusion zone (center)
        const photoRight = x + width;
        const photoBottom = y + height;
        const photoTop = y;
        
        const inCameraZone = (
            (photoRight > cameraLeft - cameraExclusionMargin && 
             x < cameraRight + cameraExclusionMargin) &&
            (photoBottom > cameraTop - cameraExclusionMargin && 
             photoTop < cameraBottom + cameraExclusionMargin)
        );
        
        // Check for collisions with other photos
        if (!inCameraZone && !hasCollision(x, y, width, height)) {
            return { x, y, rotation };
        }
        
        attempts++;
    }
    
    // Fallback: return position even if collision (better than nothing)
    const padding = 20;
    const headingHeight = window.innerWidth <= 480 ? 70 : 100;
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;
    const minY = padding + headingHeight;
    const availableHeight = maxY - minY;
    
    // Try to avoid camera area in fallback - prioritize top and bottom
    let x, y;
    const fallbackAttempts = 15;
    for (let i = 0; i < fallbackAttempts; i++) {
        x = Math.random() * maxX + padding;
        // Prioritize top and bottom: 50% top, 5% middle, 45% bottom
        const zone = Math.random();
        if (zone < 0.5) {
            // Top area - where note space is
            y = minY + Math.random() * (availableHeight * 0.4);
        } else if (zone < 0.55) {
            // Middle area (very small chance, but avoid camera center)
            y = minY + (availableHeight * 0.4) + Math.random() * (availableHeight * 0.2);
        } else {
            // Bottom area
            y = minY + (availableHeight * 0.6) + Math.random() * (availableHeight * 0.4);
        }
        
        // Check if it's in camera zone
        const photoRight = x + width;
        const photoBottom = y + height;
        const photoTop = y;
        const inCameraZone = (
            (photoRight > cameraLeft - cameraExclusionMargin && 
             x < cameraRight + cameraExclusionMargin) &&
            (photoBottom > cameraTop - cameraExclusionMargin && 
             photoTop < cameraBottom + cameraExclusionMargin)
        );
        
        if (!inCameraZone) break;
    }
    
    // If still in camera zone, force to top corners (left or right)
    if (!x || !y) {
        const useLeft = Math.random() < 0.5;
        x = useLeft ? padding : (window.innerWidth - width - padding);
        y = minY + 10;
    }
    
    return {
        x: x,
        y: y,
        rotation: (Math.random() - 0.5) * 10
    };
}

// Check if position collides with existing photos
function hasCollision(x, y, width, height) {
    const margin = 30; // Minimum distance between photos
    
    for (const placed of placedPhotos) {
        if (
            x < placed.x + placed.width + margin &&
            x + width + margin > placed.x &&
            y < placed.y + placed.height + margin &&
            y + height + margin > placed.y
        ) {
            return true;
        }
    }
    
    return false;
}

// Show note after all photos
function showNote() {
    snapButton.disabled = true;
    polaroidCamera.style.opacity = '0.5';
    
    note.style.display = 'block';
    // Force a reflow to get accurate dimensions
    note.offsetHeight;
    const position = getRandomPosition(note, 280, 200);
    note.style.left = position.x + 'px';
    note.style.top = position.y + 'px';
    note.style.setProperty('--rotation', position.rotation + 'deg');
    
    // Add note to placed items for collision detection
    placedPhotos.push({
        element: note,
        x: position.x,
        y: position.y,
        width: 280,
        height: 200
    });
    
    // Show selfie capture after a delay
    setTimeout(() => {
        showSelfieCapture();
    }, 2000);
}

// Show selfie capture interface
function showSelfieCapture() {
    if (selfieCapture) {
        selfieCapture.style.display = 'flex';
        startWebcam();
    }
}

// Start webcam
async function startWebcam() {
    try {
        const constraints = {
            video: {
                facingMode: 'user', // Front camera
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoPreview) {
            videoPreview.srcObject = videoStream;
        }
    } catch (err) {
        console.error('Error accessing webcam:', err);
        alert('Unable to access camera. Please check permissions.');
        cancelSelfie();
    }
}

// Capture selfie
function captureSelfie() {
    if (!videoStream || !videoPreview || !captureCanvas) return;
    
    const video = videoPreview;
    const canvas = captureCanvas;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to image
    canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        addSelfieToWall(imageUrl);
        
        // Stop webcam
        stopWebcam();
        if (selfieCapture) {
            selfieCapture.style.display = 'none';
        }
    }, 'image/jpeg', 0.95);
}

// Add selfie to wall
function addSelfieToWall(imageUrl) {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-wrapper';
    
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Selfie';
    
    polaroid.appendChild(img);
    wrapper.appendChild(polaroid);
    
    const position = getRandomPosition(wrapper);
    wrapper.style.left = position.x + 'px';
    wrapper.style.top = position.y + 'px';
    wrapper.style.setProperty('--rotation', position.rotation + 'deg');
    
    wallContainer.appendChild(wrapper);
    placedPhotos.push({
        element: wrapper,
        x: position.x,
        y: position.y,
        width: 250,
        height: 300
    });
}

// Cancel selfie capture
function cancelSelfie() {
    stopWebcam();
    if (selfieCapture) {
        selfieCapture.style.display = 'none';
    }
}

// Stop webcam stream
function stopWebcam() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        if (videoPreview) {
            videoPreview.srcObject = null;
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    // Photos stay in place on resize
});
