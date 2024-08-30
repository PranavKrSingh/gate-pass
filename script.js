document.addEventListener('DOMContentLoaded', function() {
    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var startCameraButton = document.getElementById('startCamera');
    var snapButton = document.getElementById('snap');
    var retakeButton = document.getElementById('retake');
    var finalPhoto = null; // To store the final photo
    var isSubmitting = false; // Flag to prevent multiple submissions

    startCameraButton.addEventListener('click', function(e) {
        e.preventDefault();
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                video.style.display = 'block';
                snapButton.style.display = 'block';
                startCameraButton.style.display = 'none';
                retakeButton.style.display = 'none'; // Hide retake button initially
            })
            .catch(function(err) {
                console.log("An error occurred: " + err);
            });
    });

    snapButton.addEventListener('click', function(e) {
        e.preventDefault();
        context.drawImage(video, 0, 0, 320, 240);
        finalPhoto = canvas.toDataURL('image/png');
        localStorage.setItem('visitorPhoto', finalPhoto);

        // Stop the video stream and hide the video element
        video.srcObject.getTracks().forEach(track => track.stop());
        video.style.display = 'none';

        // Display the captured image in the same box
        canvas.style.display = 'block';
        snapButton.style.display = 'none';
        retakeButton.style.display = 'block'; // Show retake button
    });

    retakeButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Restart the camera and hide the captured image
        video.style.display = 'block';
        canvas.style.display = 'none';
        snapButton.style.display = 'block';
        retakeButton.style.display = 'none';
        
        // Restart the camera stream
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(err) {
                console.log("An error occurred: " + err);
            });
    });

    var form = document.getElementById('Visitor');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (isSubmitting) {
            console.log('Form is already being submitted.');
            return;
        }
        isSubmitting = true;

        var formData = {
            companyName: document.getElementById('companyName').value,
            visitorName: document.getElementById('visitorName').value,
            visitorContact: document.getElementById('visitorContact').value,
            purpose: document.getElementById('purpose').value,
            date: document.getElementById('date').value,
            timeIn: document.getElementById('timeIn').value,
            timeOut: document.getElementById('timeOut').value,
            authorizedBy: document.getElementById('authorizedBy').value,
            department: document.getElementById('department').value,
            securityName: document.getElementById('securityName').value,
            comments: document.getElementById('comments').value
        };

        // Store data in localStorage
        localStorage.setItem('formData', JSON.stringify(formData));
        if (finalPhoto) {
            localStorage.setItem('visitorPhoto', finalPhoto); // Save the final photo
        }

        // Call functions to generate gate pass, generate QR code, and store data in Google Sheets
        generateGatePass(formData).then((gatePassUrl) => {
            generateQRCode(gatePassUrl);
            return storeInGoogleSheet(formData);
        }).then(() => {
            console.log("All tasks completed");
            window.location.href = 'display.html';
        }).catch(error => {
            console.error("An error occurred:", error);
        }).finally(() => {
            isSubmitting = false; // Reset the submitting flag
        });
    });

    function generateGatePass(formData) {
        return new Promise((resolve) => {
            // Generate a URL or string for the gate pass, for example:
            var gatePassUrl = `https://example.com/gatepass?visitorName=${encodeURIComponent(formData.visitorName)}&date=${encodeURIComponent(formData.date)}`;
            console.log("Gate pass generated");
            resolve(gatePassUrl); // Resolve with the generated URL or string
        });
    }

    function generateQRCode(data) {
        var qrCodeContainer = document.getElementById('qrCodeContainer');
        qrCodeContainer.innerHTML = ''; // Clear any existing QR code

        var qrCode = new QRCode(qrCodeContainer, {
            text: data,
            width: 128,
            height: 128
        });

        console.log("QR Code generated");
    }

    function storeInGoogleSheet(data) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzQbOyY_R226NzxinW0uFrqdFQ81lU-p6xiRkXwJXTlhDKxFbHptcoyAcLtaQ7MUpqeRQ/exec';
        return fetch(scriptURL, {
            method: 'POST',
            body: new URLSearchParams(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log("Data stored in Google Sheets");
        });
    }
});
