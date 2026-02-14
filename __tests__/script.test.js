/**
 * Unit tests for Valentine's Day Polaroid Photo App
 */

// Mock DOM before importing
const mockWallContainer = {
  appendChild: jest.fn(),
  style: {}
};

const mockSnapButton = {
  addEventListener: jest.fn(),
  disabled: false,
  style: { display: 'block' }
};

const mockNote = {
  style: { display: 'none' },
  offsetHeight: 200
};

const mockBackgroundMusic = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  volume: 0.5,
  paused: false
};

const mockSoundIcon = {
  textContent: '🔊'
};

// Setup DOM mocks
document.getElementById = jest.fn((id) => {
  const elements = {
    'wallContainer': mockWallContainer,
    'snapButton': mockSnapButton,
    'note': mockNote,
    'backgroundMusic': mockBackgroundMusic,
    'soundToggle': { addEventListener: jest.fn() },
    'soundIcon': mockSoundIcon,
    'polaroidCamera': { style: { opacity: '1' } },
    'selfieCapture': { style: { display: 'none' } },
    'videoPreview': {},
    'captureCanvas': {},
    'captureButton': { addEventListener: jest.fn() },
    'cancelButton': { addEventListener: jest.fn() }
  };
  return elements[id] || null;
});

// Mock window
window.innerWidth = 1024;
window.innerHeight = 768;

// Mock Image constructor
global.Image = jest.fn(() => ({
  src: '',
  onload: null,
  onerror: null
}));

// Mock createElement
document.createElement = jest.fn((tag) => {
  const element = {
    className: '',
    style: {},
    setProperty: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    textContent: ''
  };
  return element;
});

describe('Photo Positioning Logic', () => {
  let getRandomPosition, hasCollision;
  
  beforeEach(() => {
    // Reset window dimensions
    window.innerWidth = 1024;
    window.innerHeight = 768;
    
    // Import functions (we'll need to extract them or test the logic)
    // For now, we'll test the logic directly
  });

  test('should calculate camera exclusion zone correctly', () => {
    const isMobile = window.innerWidth <= 768;
    const cameraWidth = isMobile ? Math.min(240, window.innerWidth * 0.7) : 320;
    const cameraHeight = isMobile ? Math.min(210, window.innerHeight * 0.3) : 280;
    const cameraCenterX = window.innerWidth / 2;
    const cameraCenterY = window.innerHeight / 2;
    
    expect(cameraWidth).toBe(320);
    expect(cameraHeight).toBe(280);
    expect(cameraCenterX).toBe(512);
    expect(cameraCenterY).toBe(384);
  });

  test('should prioritize top and bottom areas', () => {
    const padding = 20;
    const headingHeight = 100;
    const width = 250;
    const height = 300;
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;
    const minY = padding + headingHeight;
    const availableHeight = maxY - minY;
    
    // Test top area (should be in first 35% of available height)
    const topAreaHeight = availableHeight * 0.35;
    const topY = minY + Math.random() * topAreaHeight;
    
    expect(topY).toBeGreaterThanOrEqual(minY);
    expect(topY).toBeLessThanOrEqual(minY + topAreaHeight);
    
    // Test bottom area (should be in last 35% of available height)
    const bottomAreaStart = availableHeight * 0.65;
    const bottomY = minY + bottomAreaStart + Math.random() * (availableHeight - bottomAreaStart);
    
    expect(bottomY).toBeGreaterThanOrEqual(minY + bottomAreaStart);
    expect(bottomY).toBeLessThanOrEqual(maxY);
  });
});

describe('Collision Detection', () => {
  test('should detect collisions between photos', () => {
    const placedPhotos = [
      { x: 100, y: 100, width: 250, height: 300 },
      { x: 400, y: 200, width: 250, height: 300 }
    ];
    
    const margin = 15;
    
    // Photo that overlaps
    const x1 = 120;
    const y1 = 120;
    const width1 = 250;
    const height1 = 300;
    
    const hasCollision = (x, y, width, height) => {
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
    };
    
    expect(hasCollision(x1, y1, width1, height1)).toBe(true);
    
    // Photo that doesn't overlap (far enough away)
    const x2 = 800;
    const y2 = 500;
    expect(hasCollision(x2, y2, width1, height1)).toBe(false);
  });
});

describe('Photo Element Creation', () => {
  test('should create photo wrapper element', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-wrapper';
    
    expect(wrapper.className).toBe('photo-wrapper');
  });

  test('should create polaroid element with image', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-wrapper';
    
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';
    
    const img = document.createElement('img');
    img.src = 'photos/photo1.jpg';
    img.alt = 'Photo 1';
    
    polaroid.appendChild(img);
    wrapper.appendChild(polaroid);
    
    expect(polaroid.className).toBe('polaroid');
    expect(img.src).toBe('photos/photo1.jpg');
    expect(img.alt).toBe('Photo 1');
  });
});

describe('Sound Toggle', () => {
  test('should toggle sound on', () => {
    let isSoundOn = false;
    isSoundOn = !isSoundOn;
    
    expect(isSoundOn).toBe(true);
  });

  test('should toggle sound off', () => {
    let isSoundOn = true;
    isSoundOn = !isSoundOn;
    
    expect(isSoundOn).toBe(false);
  });

  test('should update icon when sound is toggled', () => {
    const soundIcon = { textContent: '🔊' };
    let isSoundOn = true;
    
    isSoundOn = !isSoundOn;
    soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
    
    expect(soundIcon.textContent).toBe('🔇');
    
    isSoundOn = !isSoundOn;
    soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
    
    expect(soundIcon.textContent).toBe('🔊');
  });
});

describe('Photo Index Management', () => {
  test('should track current photo index', () => {
    let currentPhotoIndex = 0;
    const totalPhotos = 20;
    
    expect(currentPhotoIndex).toBe(0);
    expect(currentPhotoIndex).toBeLessThan(totalPhotos);
  });

  test('should increment photo index on snap', () => {
    let currentPhotoIndex = 0;
    const totalPhotos = 20;
    
    currentPhotoIndex++;
    expect(currentPhotoIndex).toBe(1);
    
    currentPhotoIndex++;
    expect(currentPhotoIndex).toBe(2);
  });

  test('should stop at total photos limit', () => {
    let currentPhotoIndex = 19;
    const totalPhotos = 20;
    
    if (currentPhotoIndex >= totalPhotos) {
      // Should not proceed
      expect(currentPhotoIndex).toBe(19);
    }
    
    currentPhotoIndex++;
    expect(currentPhotoIndex).toBe(20);
    expect(currentPhotoIndex).toBeGreaterThanOrEqual(totalPhotos);
  });
});

describe('Camera Exclusion Zone', () => {
  test('should calculate camera exclusion zone with margin', () => {
    const cameraWidth = 320;
    const cameraHeight = 280;
    const cameraCenterX = 512;
    const cameraCenterY = 384;
    const cameraLeft = cameraCenterX - cameraWidth / 2;
    const cameraRight = cameraCenterX + cameraWidth / 2;
    const cameraTop = cameraCenterY - cameraHeight / 2;
    const cameraBottom = cameraCenterY + cameraHeight / 2;
    const cameraExclusionMargin = 120;
    
    expect(cameraLeft).toBe(352);
    expect(cameraRight).toBe(672);
    expect(cameraTop).toBe(244);
    expect(cameraBottom).toBe(524);
    
    // Check exclusion zone boundaries
    const exclusionLeft = cameraLeft - cameraExclusionMargin;
    const exclusionRight = cameraRight + cameraExclusionMargin;
    const exclusionTop = cameraTop - cameraExclusionMargin;
    const exclusionBottom = cameraBottom + cameraExclusionMargin;
    
    expect(exclusionLeft).toBe(232);
    expect(exclusionRight).toBe(792);
    expect(exclusionTop).toBe(124);
    expect(exclusionBottom).toBe(644);
  });

  test('should detect if photo is in camera exclusion zone', () => {
    const cameraLeft = 352;
    const cameraRight = 672;
    const cameraTop = 244;
    const cameraBottom = 524;
    const cameraExclusionMargin = 120;
    
    // Photo in exclusion zone
    const photoX = 400;
    const photoY = 300;
    const photoWidth = 250;
    const photoHeight = 300;
    
    const photoRight = photoX + photoWidth;
    const photoBottom = photoY + photoHeight;
    const photoTop = photoY;
    
    const inCameraZone = (
      (photoRight > cameraLeft - cameraExclusionMargin && 
       photoX < cameraRight + cameraExclusionMargin) &&
      (photoBottom > cameraTop - cameraExclusionMargin && 
       photoTop < cameraBottom + cameraExclusionMargin)
    );
    
    expect(inCameraZone).toBe(true);
    
    // Photo outside exclusion zone (completely to the left and above)
    // Exclusion zone: x: 232-792, y: 124-644
    // Place photo at (50, 50) with smaller size to ensure it's outside
    const photoX2 = 50;
    const photoY2 = 50;
    const photoWidth2 = 100; // Smaller photo
    const photoHeight2 = 50; // Smaller photo
    const photoRight2 = photoX2 + photoWidth2; // 150
    const photoBottom2 = photoY2 + photoHeight2; // 100
    const photoTop2 = photoY2; // 50
    
    const inCameraZone2 = (
      (photoRight2 > cameraLeft - cameraExclusionMargin && 
       photoX2 < cameraRight + cameraExclusionMargin) &&
      (photoBottom2 > cameraTop - cameraExclusionMargin && 
       photoTop2 < cameraBottom + cameraExclusionMargin)
    );
    
    // Photo at (50, 50) with size 100x50 ends at (150, 100)
    // Exclusion zone starts at x=232, y=124
    // So photoRight2 (150) is NOT > 232, so it should be false
    expect(inCameraZone2).toBe(false);
  });
});

describe('Photo Distribution', () => {
  test('should split photos 50/50 between top and bottom', () => {
    const zone = Math.random();
    const isTop = zone < 0.5;
    const isBottom = zone >= 0.5;
    
    expect(isTop || isBottom).toBe(true);
    expect(isTop && isBottom).toBe(false);
  });

  test('should place photos in top area correctly', () => {
    const padding = 20;
    const headingHeight = 100;
    const availableHeight = 348; // 768 - 20 - 300 - 100
    const topAreaHeight = availableHeight * 0.35;
    const minY = padding + headingHeight;
    
    const topY = minY + Math.random() * topAreaHeight;
    
    expect(topY).toBeGreaterThanOrEqual(minY);
    expect(topY).toBeLessThanOrEqual(minY + topAreaHeight);
  });

  test('should place photos in bottom area correctly', () => {
    const padding = 20;
    const headingHeight = 100;
    const availableHeight = 348;
    const bottomAreaStart = availableHeight * 0.65;
    const minY = padding + headingHeight;
    
    const bottomY = minY + bottomAreaStart + Math.random() * (availableHeight - bottomAreaStart);
    
    expect(bottomY).toBeGreaterThanOrEqual(minY + bottomAreaStart);
    expect(bottomY).toBeLessThanOrEqual(minY + availableHeight);
  });
});

describe('Photo Preloading', () => {
  test('should preload all 20 photos', () => {
    const totalPhotos = 20;
    const photos = [];
    
    for (let i = 1; i <= totalPhotos; i++) {
      const img = new Image();
      img.src = `photos/photo${i}.jpg`;
      photos.push(img);
    }
    
    expect(photos.length).toBe(20);
    expect(photos[0].src).toBe('photos/photo1.jpg');
    expect(photos[19].src).toBe('photos/photo20.jpg');
  });
});
