const qrText = document.getElementById('qr-text');
const sizes = document.getElementById('sizes');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.querySelector('.qr-body');

let size = sizes.value;

generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isEmptyInput();
});

sizes.addEventListener('change', (e) => {
    size = e.target.value;
    // Regenerate QR code when size changes
    isEmptyInput(); 
});

downloadBtn.addEventListener('click', (e) => {
    // Prevent the default link behavior
    e.preventDefault(); 
    let img = document.querySelector('.qr-body img');
    let link = document.createElement('a');
    
    if (img !== null) {
        link.href = img.getAttribute('src');
    } else {
        let canvas = document.querySelector('.qr-body canvas');
        if (canvas) {
            link.href = canvas.toDataURL("image/png");
        }
    }
    
    // Setting the filename and trigger download
    link.download = "QR_Code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

function isEmptyInput() {
    // conditional logic for better readability
    if (qrText.value.trim().length > 0) {
        generateQRCode();
    } else {
        alert("Enter the text or URL to generate your QR code");
    }
}

function generateQRCode() {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: qrText.value,
        height: size,
        width: size,
        colorLight: "#fff",
        colorDark: "#000",
    });
}
