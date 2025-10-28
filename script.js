const qrText = document.getElementById('qr-text');
const sizes = document.getElementById('sizes');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.querySelector('.qr-body');
let colorPicker = document.querySelector("#color-picker");
let color = "#000";

// --- MODIFICATION 1: Disable the button on page load ---
document.addEventListener('DOMContentLoaded', () => {
    downloadBtn.classList.add('disabled');
});

colorPicker.addEventListener('change',(e)=>{
    color = e.target.value;
    // Optional: Regenerate if you want color to change live
    // if(qrText.value.trim().length > 0) generateQRCode();
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
    
    // --- MODIFICATION 2: Check if disabled ---
    if (downloadBtn.classList.contains('disabled')) {
        return; // Stop here if it's disabled
    }

    let img = document.querySelector('.qr-body img');
    let link = document.createElement('a'); // This is fine! Keep it.
    
    if (img !== null) {
        link.href = img.getAttribute('src');
    } else {
        let canvas = document.querySelector('.qr-body canvas');
        if (canvas) {
            link.href = canvas.toDataURL("image/png");
        } else {
            // This case shouldn't be reachable if our logic is right,
            // but it's good to be safe.
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
        // --- MODIFICATION 3: Disable button if input is empty ---
        downloadBtn.classList.add('disabled'); 
    }
}

function generateQRCode() {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: qrText.value,
        height: size,
        width: size,
        colorLight: "#fff",
        colorDark: color
    });
    
    // --- MODIFICATION 4: Enable button on successful generation ---
    downloadBtn.classList.remove('disabled');
}
