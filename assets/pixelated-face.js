const video = document.querySelector('.webcam');
const canvas = document.querySelector('.video');
const ctx = canvas.getContext('2d');
const faceCanvas = document.querySelector('.face');
const faceCtx = faceCanvas.getContext('2d');
const faceDetector = new window.FaceDetector();
const optionInputs = document.querySelectorAll('.controls input[type=range]');

const options = {
	SIZE: 10,
	SCALE: 1.35,
};

function handleOptions(event) {
    const { value, name } = event.currentTarget;
    options[name] = parseFloat(value);
}

optionInputs.forEach((input) => input.addEventListener('input', handleOptions));

// Write a function that will populate the users video
async function populateVideo() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			width: 1280,
			height: 720,
		},
	});
	video.srcObject = stream;
	await video.play();

	// size the canvases to be the same size as the v
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;

	faceCanvas.width = video.videoWidth;
	faceCanvas.height = video.videoHeight;
}

async function detect() {
	const faces = await faceDetector.detect(video);

	faces.forEach(drawFace);
	faces.forEach(censor);

	// ask the browser when the next animation frame is, and tell it to run detect for us
	requestAnimationFrame(detect); // for better performance
}

function drawFace(face) {
	const { width, height, top, left } = face.boundingBox;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = '#ffc600';
	ctx.lineWidth = 2;
	ctx.strokeRect(left, top, width, height);
}

// snapshot face, size it really small resolution. And use this image as a face censor.
// Image will lose details and it will look like a blurry image.
function censor({ boundingBox: face }) {
	faceCtx.imageSmoothingEnabled = false;

	// clear canvas
	faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

	// draw the small face
	faceCtx.drawImage(
		// 5 source arguments => how to pull video
		video, // where does the source come from?
		face.x, // where does we start the source pull from?
		face.y,
		face.width,
		face.height,
		// 4 draw arguments => how to draw to canvas
		face.x, // where should we start drawing the x and y?
		face.y,
		options.SIZE,
		options.SIZE
	);

	// draw the small face back on, but scale up
	const width = face.width * options.SCALE;
	const height = face.height * options.SCALE;
	faceCtx.drawImage(
		// 5 source arguments => how to pull video
		faceCanvas, // source
		face.x,
		face.y,
		options.SIZE,
		options.SIZE,
		// 4 draw arguments => how to draw to canvas
		face.x - (width - face.width) / 2,
		face.y - (height - face.height) / 2,
		width,
		height
	);
}

populateVideo().then(detect);
