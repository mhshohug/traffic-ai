// ==========================
// VARIABLES
// ==========================

let model;
let stream;

let detectionsLog = [];
let currentCounts = {};

let trackedObjects = {};
let nextObjectId = 1;
let objectDirections = {};
let objectSpeeds = {};

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

const historyBtn =
document.getElementById("historyBtn");

const galleryBtn =
document.getElementById("galleryBtn");

// ==========================
// LOAD MODEL
// ==========================

async function loadModel(){

countsDiv.innerHTML =
"Loading AI Model...";

model =
await cocoSsd.load();

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
await navigator.mediaDevices
.getUserMedia({

video:{
facingMode:"environment"
},

audio:false

});

video.srcObject =
stream;

video.onloadedmetadata =
()=>{

canvas.width =
video.videoWidth;

canvas.height =
video.videoHeight;

detectObjects();

};

}
catch(err){

alert(
"Camera Error: " +
err
);

}

}

// ==========================
// CAMERA STOP
// ==========================

function stopCamera(){

if(stream){

stream
.getTracks()
.forEach(track=>{

track.stop();

});

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

if(
!model ||
!video.srcObject
){

requestAnimationFrame(
detectObjects
);

return;

}

const predictions =
await model.detect(
video
);

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

const counts = {};

let html =
"<h4>Live Detection</h4>";

predictions.forEach(item=>{

const [x,y,w,h] =
item.bbox;

const centerX =
x + (w / 2);

const centerY =
y + (h / 2);

let matchedId =
null;
const currentTime =
Date.now();  
for(const id in trackedObjects){

const old =
trackedObjects[id];
  
const dx =
old.x - centerX;

const dy =
old.y - centerY;

const distance =
Math.sqrt(
dx * dx +
dy * dy
);

if(distance < 80){

matchedId = id;
break;

}

}
if(!matchedId){

matchedId =
nextObjectId++;

}

const oldObject =
trackedObjects[
matchedId
];

if(oldObject){

let direction =
"Stationary";

if(centerX >
oldObject.x + 20){

direction =
"Left → Right";

}
else if(
centerX <
oldObject.x - 20
){

direction =
"Right → Left";

}
else if(
centerY >
oldObject.y + 20
){

direction =
"Top → Bottom";

}
else if(
centerY <
oldObject.y - 20
){

direction =
"Bottom → Top";

}

objectDirections[
matchedId
] = direction;

const dx =
centerX - oldObject.x;

const dy =
centerY - oldObject.y;

const distance =
Math.sqrt(
(dx * dx) +
(dy * dy)
);

const dt =
(currentTime -
(oldObject.time || currentTime))
/ 1000;

let speed = 0;

if(dt > 0){

speed =
Math.round(
(distance / dt) * 0.2
);

}

objectSpeeds[
matchedId
] = speed;  
  
}

trackedObjects[
matchedId
] = {

x:centerX,
y:centerY,
time:currentTime,
class:item.class

};  
counts[item.class] =
(
counts[item.class]
||
0
)
+
1;

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
item.class +
" #" +
matchedId +
" " +
(
objectDirections[
matchedId
] || ""
) +
" " +
(
objectSpeeds[
matchedId
] || 0
) +
" km/h",
x,
y > 15 ? y-5 : 15
);

});

// save latest counts

currentCounts =
counts;

// display counts

for(
const key
in
counts
){

html +=
"<b>" +
key +
"</b> : " +
counts[key] +
"<br>";

}

countsDiv.innerHTML =
html;

// keep running

requestAnimationFrame(
detectObjects
);

}
// ==========================
// SAVE SNAPSHOT
// ==========================

saveBtn.onclick = () => {

if(!video.srcObject){

alert(
"Camera not started"
);

return;

}

const snapCanvas =
document.createElement(
"canvas"
);

snapCanvas.width =
video.videoWidth;

snapCanvas.height =
video.videoHeight;

const snapCtx =
snapCanvas.getContext(
"2d"
);

snapCtx.drawImage(
video,
0,
0
);

const image =
snapCanvas.toDataURL(
"image/jpeg"
);

const snapshotData = {

time:
new Date()
.toLocaleString(),

counts:
JSON.stringify(
currentCounts
),

image:
image

};

saveSnapshot(
snapshotData
);

alert(
"Snapshot Saved"
);

};

// ==========================
// CSV EXPORT
// ==========================

csvBtn.onclick =
async ()=>{

const data =
await getAllDetections();

if(
data.length === 0
){

alert(
"No Data Found"
);

return;

}

let csv =
"Time,Counts\n";

data.forEach(
row=>{

csv +=
`"${row.time}","${row.counts}"\n`;

}
);

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
document.createElement(
"a"
);

link.href =
url;

link.download =
"traffic_data.csv";

link.click();

URL.revokeObjectURL(
url
);

};

// ==========================
// HISTORY
// ==========================

historyBtn.onclick =
async ()=>{

const data =
await getAllDetections();

alert(
"Saved Records : " +
data.length
);

console.log(
data
);

};

// ==========================
// GALLERY
// ==========================

galleryBtn.onclick =
async ()=>{

const snapshots =
await getAllSnapshots();

if(
snapshots.length === 0
){

alert(
"No Snapshots Found"
);

return;

}

let text =
"Saved Snapshots\n\n";

snapshots.forEach(
(item,index)=>{

text +=

"#" +
(index+1) +

"\nTime : " +

item.time +

"\nCounts : " +

item.counts +

"\n\n";

}
);

alert(
text
);

console.log(
snapshots
);

};

// ==========================
// CUSTOM DATASET
// ==========================

const addDatasetBtn =
document.getElementById(
"addDatasetBtn"
);

addDatasetBtn.onclick =
()=>{

const className =
document
.getElementById(
"className"
)
.value;

const files =
document
.getElementById(
"datasetImages"
)
.files;

if(
!className
){

alert(
"Enter Class Name"
);

return;

}

if(
files.length === 0
){

alert(
"Select Images"
);

return;

}

document
.getElementById(
"datasetInfo"
)
.innerHTML =

"Class : " +

className +

"<br>Images : " +

files.length +

"<br>Status : Saved";

alert(
"Dataset Added"
);

};
