// --- 1. DOM ELEMENT SELECTORS ---
const qrTypeSelect = document.getElementById('qr-type');
const inputContainer = document.getElementById('input-container');
const textInputs = document.getElementById('text-inputs');
const wifiInputs = document.getElementById('wifi-inputs');
const vcardInputs = document.getElementById('vcard-inputs');

const qrText = document.getElementById('qr-text');
const wifiSsid = document.getElementById('wifi-ssid');
const wifiPass = document.getElementById('wifi-pass');
const wifiType = document.getElementById('wifi-type');
const vcardName = document.getElementById('vcard-name');
const vcardPhone = document.getElementById('vcard-phone');
const vcardEmail = document.getElementById('vcard-email');

const sizes = document.getElementById('sizes');
const colorPicker = document.getElementById('color-picker');
const contrastWarning = document.getElementById('contrast-warning');
const logoUpload = document.getElementById('logo-upload');
const clearLogoBtn = document.getElementById('clear-logo');
const qrContainer = document.querySelector('.qr-body');
const downloadBtn = document.getElementById('downloadBtn');

// --- 2. STATE VARIABLES ---
let qrCode = null; // To hold the QRCode.js instance
let logoImage = null; // To hold the uploaded logo Image object
let currentQrData = ""; // The text data for the QR code
let currentQrColor = "#000000";
let currentQrSize = 300;

// --- 3. UTILITY FUNCTIONS ---

/**
 * Debounce function to limit how often a function is called.
 * This prevents generating a QR code on every single keystroke.
 * @param {Function} func The function to call.
 * @param {number} delay The delay in milliseconds.
 */
function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// --- 4. CORE LOGIC ---

/**
 * Main function to render the QR code.
 * This is the function we will debounce.
 */
function renderQRCode() {
    // Step 1: Get the data string from the inputs
    currentQrData = buildQrData();
    
    // Step 2: Get customization options
    currentQrColor = colorPicker.value;
    currentQrSize = parseInt(sizes.value, 10);

    // Step 3: Validate color contrast and update warning
    validateContrast(currentQrColor);

    // Step 4: Clear the container
    qrContainer.innerHTML = "";
    
    // If no data, disable download and do nothing else
    if (currentQrData.trim().length === 0) {
        downloadBtn.classList.add('disabled');
        qrContainer.innerHTML = "<p>Type to generate...</p>"; // Placeholder
        return;
    }

    // Step 5: Generate the QR code
    // We use High Error Correction (H) to make room for the logo
    try {
        // Create a temporary div for qrcode.js to draw on
        const tempDiv = document.createElement('div');
        new QRCode(tempDiv, {
            text: currentQrData,
            width: currentQrSize,
            height: currentQrSize,
            colorDark: currentQrColor,
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H // High error correction
        });

        // The library might create a <canvas> or an <img>
        // We need to wait a tiny bit for it to be drawn
        setTimeout(() => {
            const qrElement = tempDiv.querySelector('canvas') || tempDiv.querySelector('img');
            if (qrElement) {
                drawFinalCanvas(qrElement);
            }
            downloadBtn.classList.remove('disabled');
        }, 50); // 50ms delay for drawing

    } catch (error) {
        console.error("QR Code generation failed:", error);
        qrContainer.innerHTML = "<p>Error generating code.</p>";
        downloadBtn.classList.add('disabled');
    }
}

/**
 * Draws the final QR code (with logo) onto our own canvas.
 * @param {HTMLElement} qrElement The <canvas> or <img> from qrcode.js
 */
function drawFinalCanvas(qrElement) {
    qrContainer.innerHTML = ""; // Clear for the new canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = currentQrSize;
    finalCanvas.height = currentQrSize;
    const ctx = finalCanvas.getContext('2d');

    // Fill background with white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, currentQrSize, currentQrSize);

    // Draw the QR code (works for both img and canvas)
    ctx.drawImage(qrElement, 0, 0, currentQrSize, currentQrSize);

    // Draw the logo if it exists
    if (logoImage) {
        // Calculate logo size (e.g., 25% of QR code size)
        const logoSize = currentQrSize * 0.25;
        const logoX = (currentQrSize - logoSize) / 2;
        const logoY = (currentQrSize - logoSize) / 2;
        
        // Add a white background behind the logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4); // Small padding

        // Draw the logo image
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    }
    
    // Add the final canvas to the page
    qrContainer.appendChild(finalCanvas);
}


/**
 * Gathers data from the active input fields and formats it.
 * @returns {string} The formatted string for the QR code.
 */
function buildQrData() {
    const type = qrTypeSelect.value;
    switch (type) {
        case 'wifi':
            // WIFI:T:WPA;S:MyNetwork;P:MyPassword123;;
            const ssid = wifiSsid.value;
            const pass = wifiPass.value;
            const enc = wifiType.value;
            if (!ssid) return "";
            return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
        case 'vcard':
            // BEGIN:VCARD...
            const name = vcardName.value;
            const phone = vcardPhone.value;
            const email = vcardEmail.value;
            if (!name && !phone && !email) return "";
            return `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
        case 'text':
        default:
            return qrText.value;
    }
}

/**
 * Shows/hides the correct input fields based on QR type.
 */
function updateInputPanels() {
    const type = qrTypeSelect.value;
    // Hide all panels first
    [textInputs, wifiInputs, vcardInputs].forEach(panel => panel.classList.add('hidden'));
    
    // Show the correct one
    if (type === 'text') {
        textInputs.classList.remove('hidden');
    } else if (type === 'wifi') {
        wifiInputs.classList.remove('hidden');
    } else if (type === 'vcard') {
        vcardInputs.classList.remove('hidden');
    }
    
    // Re-render the QR code with new data structure
    debouncedRender();
}

/**
 * NEW: Visually warns user about low contrast.
 * @param {string} hexColor The user's chosen color.
 */
function validateContrast(hexColor) {
    const bgColor = "#FFFFFF";
    const minContrastRatio = 3.0;
    const currentContrast = getContrastRatio(hexColor, bgColor);

    if (currentContrast < minContrastRatio) {
        contrastWarning.textContent = `Warning: This color has low contrast (${currentContrast.toFixed(1)}:1) and may be unscannable.`;
        contrastWarning.classList.remove('hidden');
        currentQrColor = "#000000"; // Force black for generation
    } else {
        contrastWarning.classList.add('hidden');
        currentQrColor = hexColor; // Color is fine
    }
}

/**
 * Handles the file upload for the logo.
 * @param {Event} e The file input change event.
 */
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) {
        logoImage = null;
        clearLogoBtn.classList.add('hidden');
        debouncedRender();
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        logoImage = new Image();
        logoImage.onload = () => {
            // Logo is loaded, re-render the QR code
            clearLogoBtn.classList.remove('hidden');
            debouncedRender();
        };
        logoImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Clears the uploaded logo.
 */
function clearLogo() {
    logoImage = null;
    logoUpload.value = null; // Clear the file input
    clearLogoBtn.classList.add('hidden');
    debouncedRender();
}

// --- 5. EVENT LISTENERS ---

// Create a debounced version of the render function
const debouncedRender = debounce(renderQRCode, 300);

// Listen for changes on ALL inputs
qrTypeSelect.addEventListener('change', updateInputPanels);
[qrText, wifiSsid, wifiPass, wifiType, vcardName, vcardPhone, vcardEmail].forEach(input => {
    input.addEventListener('input', debouncedRender);
});

sizes.addEventListener('change', debouncedRender);
colorPicker.addEventListener('input', debouncedRender); // 'input' for live color change
logoUpload.addEventListener('change', handleLogoUpload);
clearLogoBtn.addEventListener('click', clearLogo);

// Download button listener
downloadBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    if (downloadBtn.classList.contains('disabled')) {
        return;
    }

    // The QR code is now always a canvas
    const canvas = qrContainer.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL("image/png");
        link.download = "QR_Code.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    updateInputPanels(); // Show the 'text' panel
    downloadBtn.classList.add('disabled');
    qrContainer.innerHTML = "<p>Type to generate...</p>";
});


// --- 6. COLOR CONTRAST HELPER FUNCTIONS (Unchanged) ---

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return { r: +r, g: +g, b: +b };
}
function getLuminance(rgb) {
    let [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function getContrastRatio(hex1, hex2) {
    const lum1 = getLuminance(hexToRgb(hex1));
    const lum2 = getLuminance(hexToRgb(hex2));
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

