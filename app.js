// ==========================
// VARIABLES
// ==========================

let model;
let stream;

let detectionsLog = [];

const video =
document.getElementById("video");

const canvas =
document.getElementById("canvas");

const ctx =
canvas.getContext("2d");

const countsDiv =
document.getElementById("counts");

const startBtn =
document.getElementById("startBtn");

const stopBtn =
document.getElementById("stopBtn");

const saveBtn =
document.getElementById("saveBtn");

const csvBtn =
document.getElementById("csvBtn");

// ==========================
// LOAD MODEL
// ==========================

async function loadModel(){

countsDiv.innerHTML =
"Loading AI Model...";

model = await cocoSsd.load();

countsDiv.innerHTML =
"AI Model Ready";

}

loadModel();
// ==========================
// CAMERA START
// ==========================

async function startCamera(){

try{

stream =
await navigator.mediaDevices.getUserMedia({

video:{
facingMode:"environment"
},

audio:false

});

video.srcObject = stream;

video.onloadedmetadata = ()=>{

canvas.width =
video.videoWidth;

canvas.height =
video.videoHeight;

detectObjects();

};

}
catch(err){

alert(err);

}

}

// ==========================
// CAMERA STOP
// ==========================

function stopCamera(){

if(stream){

stream
.getTracks()
.forEach(track=>track.stop());

}

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

}

startBtn.onclick =
startCamera;

stopBtn.onclick =
stopCamera;
// ==========================
// OBJECT DETECTION
// ==========================

async function detectObjects(){

if(!model || !video.srcObject){

requestAnimationFrame(
detectObjects
);

return;

}

const predictions =
await model.detect(video);

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

const counts = {};

let html = `
<h4>Live Detection</h4>
`;

predictions.forEach(item=>{

const [x,y,w,h] =
item.bbox;

// count

counts[item.class] =
(counts[item.class] || 0) + 1;

// draw box

ctx.strokeStyle =
"#00ff00";

ctx.lineWidth = 3;

ctx.strokeRect(
x,
y,
w,
h
);

// label

ctx.fillStyle =
"#00ff00";

ctx.font =
"16px Arial";

ctx.fillText(
item.class,
x,
y > 15 ? y-5 : 15
);

});

// count display

for(const key in counts){

html += `
<b>${key}</b> :
${counts[key]}
<br>
`;

}

// save log

if(predictions.length){

detectionsLog.push({

time:
new Date()
.toLocaleString(),

counts:
JSON.stringify(
counts
)

});

}

countsDiv.innerHTML =
html;

requestAnimationFrame(
detectObjects
);

}
// ==========================
// SNAPSHOT SAVE
// ==========================

saveBtn.onclick = () => {

if(!video.srcObject){

alert("Camera not started");
return;

}

const snapCanvas =
document.createElement("canvas");

snapCanvas.width =
video.videoWidth;

snapCanvas.height =
video.videoHeight;

const snapCtx =
snapCanvas.getContext("2d");

snapCtx.drawImage(
video,
0,
0
);

const image =
snapCanvas.toDataURL(
"image/jpeg"
);

const link =
document.createElement("a");

link.href = image;

link.download =
"snapshot_" +
Date.now() +
".jpg";

link.click();

};

// ==========================
// CSV EXPORT
// ==========================

csvBtn.onclick = () => {

if(
detectionsLog.length === 0
){

alert(
"No data available"
);

return;

}

let csv =
"Time,Counts\n";

detectionsLog.forEach(
row => {

csv +=
`"${row.time}","${row.counts}"\n`;

});

const blob =
new Blob(
[csv],
{
type:
"text/csv"
}
);

const url =
URL.createObjectURL(
blob
);

const link =
document.createElement("a");

link.href = url;

link.download =
"traffic_data.csv";

link.click();

URL.revokeObjectURL(
url
);

};
