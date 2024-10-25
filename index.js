const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('video');
let points = [];
let scaleFactor = 1;  // Scaling from pixels to real-world units
let calibrationLength = null;
const calibrationInput = document.getElementById('calibrationInput');
const messageBox = document.getElementById('message');
let image = null;  
let usingCamera = false;
ctx.font ='50px Arial'
ctx.fillStyle = 'white'
ctx.fillText('Waiting for your image',canvas.width/8 , canvas.height/2)

// Handle image upload
document.getElementById('imageInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    image = new Image();
    image.onload = function() {
      // Clear canvas and draw the uploaded image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
    };
    image.src = e.target.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

// Toggle buttons to switch between upload and take photo
document.getElementById('uploadImageBtn').addEventListener('click', () => {
  document.getElementById('imageInput').style.display = 'block';
  document.getElementById('video').style.display = 'none';
  document.getElementById('captureBtn').style.display = 'none';
  usingCamera = false;
});

document.getElementById('takePhotoBtn').addEventListener('click', () => {
  startCamera();
  document.getElementById('imageInput').style.display = 'none';
  document.getElementById('video').style.display = 'block';
  document.getElementById('captureBtn').style.display = 'block';
  usingCamera = true;
});

// Start camera stream
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" }} })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("Error accessing camera: ", err);
      messageBox.innerText = "Camera access failed!";
    });
}

// Capture photo from video stream
document.getElementById('captureBtn').addEventListener('click', () => {
  if (usingCamera) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    image = new Image();
    image.src = canvas.toDataURL('image/png');  // Store captured image
  }
});

// Capture points on click/tap (both for mobile and desktop)
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  points.push({ x, y });

  // Draw point
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();

  // Draw line if there are 2 points
  if (points.length === 2) {
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    messageBox.innerText = "Ready for calibration or measurement.";
  }
});

// Calculate pixel distance between two points
function calculateDistance(p1, p2) {
  return ( (p2.x - p1.x)**2+(p2.y - p1.y)**2 )**0.5;
}

// Calibrate scale (pixel-to-real-world conversion)
document.getElementById('calibrate').addEventListener('click', () => {
  if (points.length !== 2) {
    messageBox.innerText = 'Please select two points for calibration.';
    return;
  }

  calibrationLength = parseFloat(calibrationInput.value);
  if (isNaN(calibrationLength) || calibrationLength <= 0) {
    messageBox.innerText = 'Please enter a valid calibration distance.';
    return;
  }

  const pixelDistance = calculateDistance(points[0], points[1]);
  scaleFactor = calibrationLength / pixelDistance;
  points = [];  // Clear points after calibration
  messageBox.innerText = `Calibration complete. Scale factor: ${scaleFactor.toFixed(2)} units/pixel. Ready to measure.`;

  // Redraw the image (to remove the drawn points/line)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (image) {
    ctx.drawImage(image, 0, 0);
  }
});

// Measure distance using the calibrated scale
document.getElementById('measure').addEventListener('click', () => {
  if (points.length !== 2) {
    messageBox.innerText = 'Please select two points to measure the distance.';
    return;
  }

  const pixelDistance = calculateDistance(points[0], points[1]);
  const realDistance = pixelDistance * scaleFactor;
  document.getElementById('message').innerText = `Measured distance: ${realDistance.toFixed(2)} units`;

  points = [];  // Clear points after measuring
  ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas after measurement

  // Redraw the image
  if (image) {
    ctx.drawImage(image, 0, 0);
  }
});
