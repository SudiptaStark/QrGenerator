const qrText = document.getElementById('qr-text');
const sizes = document.getElementById('sizes');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.querySelector('.qr-body');
let colorPicker = document.querySelector("#color-picker");
let color = "#000";

// Disable the button on page load
document.addEventListener('DOMContentLoaded', () => {
    downloadBtn.classList.add('disabled');
});

colorPicker.addEventListener('change',(e)=>{
    color = e.target.value;
    // Optional: Regenerate if you want color to change live
    if(qrText.value.trim().length > 0) generateQRCode();
});

let size = sizes.value;

generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isEmptyInput();
});

sizes.addEventListener('change', (e) => {
    size = e.target.value;
    // Regenerate QR code when size changes
    // Only regenerate if there's text
    if(qrText.value.trim().length > 0) {
        generateQRCode();
    }
});

downloadBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    // Check if disabled
    if (downloadBtn.classList.contains('disabled')) {
        return; // Stop here if it's disabled
    }

    let img = document.querySelector('.qr-body img');
    let link = document.createElement('a');
    
    if (img !== null) {
        link.href = img.getAttribute('src');
    } else {
        let canvas = document.querySelector('.qr-body canvas');
        if (canvas) {
            link.href = canvas.toDataURL("image/png");
        } else {
            return; 
        }
    }
    
    link.download = "QR_Code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

function isEmptyInput() {
    if (qrText.value.trim().length > 0) {
        generateQRCode();
    } else {
        alert("Enter the text or URL to generate your QR code");
        qrContainer.innerHTML = ""; // Clear the QR code
        downloadBtn.classList.add('disabled'); // Disable button if input is empty
    }
}

function generateQRCode() {
    qrContainer.innerHTML = "";
    
    // --- START: NEW CONTRAST CHECK ---
    const bgColor = "#FFFFFF"; // Our background is always white
    const minContrastRatio = 3.0;
    let qrColor = color; // Get the user's chosen color

    const currentContrast = getContrastRatio(qrColor, bgColor);

    // Check if the contrast is too low
    if (currentContrast < minContrastRatio) {
        alert(
            `'${qrColor}' has low contrast and may be unscannable.\n\n` +
            `We'll use black for you to ensure it works.\n` +
            `Please pick a darker color next time!`
        );
        // Fallback to a safe, dark color
        qrColor = "#000000"; 
    }
    // --- END: NEW CONTRAST CHECK ---

    new QRCode(qrContainer, {
        text: qrText.value,
        height: size,
        width: size,
        colorLight: bgColor,
        colorDark: qrColor // Use the *validated* color
    });
    
    // Enable the download button
    downloadBtn.classList.remove('disabled');
}


// --- HELPER FUNCTIONS FOR COLOR CONTRAST ---

/**
 * Converts a HEX color string to its RGB components.
 * @param {string} hex - The hex color string (e.g., "#FF33AA")
 * @returns {object} - An object with {r, g, b} properties.
 */
function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    // 3-digit hex
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } 
    // 6-digit hex
    else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return { r: +r, g: +g, b: +b }; // Return as numbers
}

/**
 * Calculates the relative luminance of a color.
 * @param {object} rgb - An object with {r, g, b} properties.
 * @returns {number} - The relative luminance (0 to 1).
 */
function getLuminance(rgb) {
    // Formula from WCAG
    let [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255; // normalize to 0-1
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the contrast ratio between two hex colors.
 * @param {string} hex1 - The first hex color.
 * @param {string} hex2 - The second hex color.
 * @returns {number} - The contrast ratio.
 */
function getContrastRatio(hex1, hex2) {
    const lum1 = getLuminance(hexToRgb(hex1));
    const lum2 = getLuminance(hexToRgb(hex2));
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    // (L1 + 0.05) / (L2 + 0.05)
    return (lighter + 0.05) / (darker + 0.05);
}
