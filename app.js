// ==========================
// VARIABLES
// ==========================

let accessToken = null;

const CLIENT_ID =
"616243778605-pff18o9lia7lkk6egiohhvra1dsp6o26.apps.googleusercontent.com";

const SCOPES =
"https://www.googleapis.com/auth/drive.file";
let model;
let stream;

let detectionsLog = [];
let currentCounts = {};

let trackedObjects = {};
let nextObjectId = 1;
let objectDirections = {};
let objectSpeeds = {};

let latestObjects = [];

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

const googleLoginBtn =
document.getElementById(
"googleLoginBtn"
);

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
  
latestObjects = [];
  
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
latestObjects.push({

id: matchedId,

type: item.class,

speed:
objectSpeeds[
matchedId
] || 0,

direction:
objectDirections[
matchedId
] || "Stationary",

x: x,
y: y,
w: w,
h: h

});
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
snapCtx.font =
"20px Arial";

snapCtx.fillStyle =
"red";

snapCtx.strokeStyle =
"yellow";

snapCtx.lineWidth = 2;

latestObjects.forEach(
obj=>{

snapCtx.strokeStyle =
"lime";

snapCtx.lineWidth = 3;

snapCtx.strokeRect(
obj.x,
obj.y,
obj.w,
obj.h
);

snapCtx.fillStyle =
"red";

snapCtx.font =
"18px Arial";

snapCtx.fillText(

obj.type +
" #" +
obj.id +
" | " +
obj.speed +
" km/h",

obj.x,
obj.y > 20
? obj.y - 5
: 20

);

});

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

objects:
latestObjects,

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
await getAllSnapshots();

const container =
document.getElementById(
"historyContainer"
);

const list =
document.getElementById(
"historyList"
);

container.style.display =
"block";

list.innerHTML = "";

if(
data.length === 0
){

list.innerHTML =
"<h3>No History Found</h3>";

return;

}

data.reverse().forEach(
(item,index)=>{

const card =
document.createElement(
"div"
);

card.className =
"history-card";

card.innerHTML =
`
<h4>Record #${index+1}</h4>

<p>
<b>Time:</b>
${item.time}
</p>

<p>
<b>Counts:</b>
${item.counts}
</p>

<div>

${
(item.objects || [])
.map(obj =>

`
<p>

🚗 <b>${obj.type}</b>

#${obj.id}

|

⚡ ${obj.speed} km/h

|

➡️ ${obj.direction}

</p>
`

)
.join("")

}

</div>

<button onclick="
showHistoryImage(
'${item.image || ""}'
)">
👁 View Snapshot
</button>

<button onclick="
deleteHistoryRecord(
${item.id}
)
">
🗑 Delete
</button>
`;

list.appendChild(
card
);

});

container.scrollIntoView({
behavior:"smooth"
});

};

// ==========================
// GALLERY
// ==========================

galleryBtn.onclick = async ()=>{

const snapshots =
await getAllSnapshots();

alert(
"Snapshots Found: " +
snapshots.length
);

const container =
document.getElementById(
"galleryContainer"
);

const list =
document.getElementById(
"galleryList"
);

if(!container || !list){

alert(
"Gallery HTML Not Found"
);

return;

}

container.style.display =
"block";

list.innerHTML = "";

if(
snapshots.length === 0
){

list.innerHTML =
"<h3>No Snapshots Found</h3>";

return;

}

snapshots.reverse().forEach(
(item,index)=>{

const card =
document.createElement("div");

card.className =
"gallery-card";

card.innerHTML =

`
<h3>Snapshot #${index+1}</h3>

<img src="${item.image || ''}">

<p><b>Time:</b> ${item.time || ''}</p>

<p>
<b>Counts:</b>
${item.counts}
</p>

<div>

${
(item.objects || [])
.map(obj =>

`
<p>

<b>${obj.type}</b>

#${obj.id}

|

${obj.speed} km/h

|

${obj.direction}

</p>
`

)
.join("")

}

</div>

<button onclick="window.open('${item.image}')">
View Image
</button>
<button onclick="
downloadSnapshot(
'${item.image}'
)
">
📥 Download
</button>
<button onclick="
deleteGallerySnapshot(
${item.id}
)
">
🗑 Delete
</button>
`;

list.appendChild(card);

});

container.scrollIntoView({
behavior:"smooth"
});

};
// ==========================
// CUSTOM DATASET
// ==========================

const addDatasetBtn =
document.getElementById(
"addDatasetBtn"
);

addDatasetBtn.onclick =
async ()=>{

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
  if(!accessToken){

alert(
"Please Connect Google Drive First"
);

return;

}
for(const file of files){

const metadata = {

name: file.name,

parents: [
"1FVgSP2rYq-1W0aKlH_8z57ZKAlqO187_"
]

};

const form = new FormData();

form.append(
"metadata",
new Blob(
[JSON.stringify(metadata)],
{
type:"application/json"
}
)
);

form.append(
"file",
file
);

await fetch(
"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
{
method:"POST",
headers:{
Authorization:
"Bearer " +
accessToken
},
body:form
}
);

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
"Dataset Uploaded To Google Drive"
);

};


window.showHistoryImage =
(image)=>{

const preview =
document.getElementById(
"historyPreview"
);

const img =
document.getElementById(
"historyPreviewImg"
);

img.src = image;

preview.style.display =
"block";

};

document.addEventListener(
"click",
(e)=>{

if(
e.target.id ===
"historyPreview"
){

e.target.style.display =
"none";

}

}
);
window.deleteHistoryRecord =
async (id)=>{

if(
!confirm(
"Delete this record?"
)
){

return;

}

deleteSnapshot(id);

alert(
"Record Deleted"
);

location.reload();

};
window.downloadSnapshot =
(image)=>{

const link =
document.createElement(
"a"
);

link.href =
image;

link.download =
"traffic_snapshot_" +
Date.now() +
".jpg";

link.click();

};
window.deleteGallerySnapshot =
(id)=>{

if(
!confirm(
"Delete this snapshot?"
)
){

return;

}

deleteSnapshot(id);

alert(
"Snapshot Deleted"
);

location.reload();

};
googleLoginBtn.onclick =
async ()=>{

const tokenClient =
google.accounts.oauth2.initTokenClient({

client_id:
CLIENT_ID,

scope:
SCOPES,

callback:
(tokenResponse)=>{

accessToken =
tokenResponse.access_token;

googleLoginBtn.innerHTML =
"✅ Drive Connected";

googleLoginBtn.style.background =
"green";

googleLoginBtn.style.color =
"white";

alert(
"Google Drive Connected Successfully"
);

}

});

tokenClient.requestAccessToken();

};
