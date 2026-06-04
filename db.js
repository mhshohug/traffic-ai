// ======================
// DATABASE
// ======================

let db;

const request =
indexedDB.open(
"TrafficAI_DB",
1
);

request.onupgradeneeded =
(event)=>{

db =
event.target.result;

if(
!db.objectStoreNames.contains(
"detections"
)
){

db.createObjectStore(
"detections",
{
keyPath:"id",
autoIncrement:true
}
);

}

};

request.onsuccess =
(event)=>{

db =
event.target.result;

console.log(
"Database Ready"
);

};

request.onerror =
(event)=>{

console.error(
"Database Error",
event
);

};

// ======================
// SAVE DETECTION
// ======================

function saveDetection(data){

if(!db) return;

const tx =
db.transaction(
["detections"],
"readwrite"
);

const store =
tx.objectStore(
"detections"
);

store.add(data);

}

// ======================
// GET ALL DETECTIONS
// ======================

function getAllDetections(){

return new Promise(
(resolve,reject)=>{

if(!db){

resolve([]);
return;

}

const tx =
db.transaction(
["detections"],
"readonly"
);

const store =
tx.objectStore(
"detections"
);

const request =
store.getAll();

request.onsuccess =
()=>{

resolve(
request.result
);

};

request.onerror =
()=>{

reject(
request.error
);

};

});

}
