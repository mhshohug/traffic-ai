// ======================
// TRAFFIC AI DATABASE
// ======================

let db;

const request = indexedDB.open("TrafficAI_DB", 2);

// ======================
// CREATE DATABASE
// ======================

request.onupgradeneeded = (event) => {

    db = event.target.result;

    // Detection Store
    if (!db.objectStoreNames.contains("detections")) {

        db.createObjectStore(
            "detections",
            {
                keyPath: "id",
                autoIncrement: true
            }
        );

    }

    // Snapshot Store
    if (!db.objectStoreNames.contains("snapshots")) {

        db.createObjectStore(
            "snapshots",
            {
                keyPath: "id",
                autoIncrement: true
            }
        );

    }

};

// ======================
// DATABASE READY
// ======================

request.onsuccess = (event) => {

    db = event.target.result;

    console.log(
        "Traffic AI Database Ready"
    );

};

request.onerror = (event) => {

    console.error(
        "Database Error",
        event
    );

};

// ======================
// DETECTIONS
// ======================

function saveDetection(data) {

    if (!db) return;

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

function getAllDetections() {

    return new Promise(
        (resolve, reject) => {

            if (!db) {

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

            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}

function clearDetections() {

    if (!db) return;

    const tx =
        db.transaction(
            ["detections"],
            "readwrite"
        );

    const store =
        tx.objectStore(
            "detections"
        );

    store.clear();

}

// ======================
// SNAPSHOTS
// ======================

function saveSnapshot(data) {

    if (!db) return;

    const tx =
        db.transaction(
            ["snapshots"],
            "readwrite"
        );

    const store =
        tx.objectStore(
            "snapshots"
        );

    store.add(data);

}

function getAllSnapshots() {

    return new Promise(
        (resolve, reject) => {

            if (!db) {

                resolve([]);
                return;

            }

            const tx =
                db.transaction(
                    ["snapshots"],
                    "readonly"
                );

            const store =
                tx.objectStore(
                    "snapshots"
                );

            const request =
                store.getAll();

            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}

function deleteSnapshot(id) {

    if (!db) return;

    const tx =
        db.transaction(
            ["snapshots"],
            "readwrite"
        );

    const store =
        tx.objectStore(
            "snapshots"
        );

    store.delete(id);

}

function clearSnapshots() {

    if (!db) return;

    const tx =
        db.transaction(
            ["snapshots"],
            "readwrite"
        );

    const store =
        tx.objectStore(
            "snapshots"
        );

    store.clear();

}
