let db;

// establish connection to db called 'budget' set to v1
const request = indexedDB.open('budget', 1);

// emit if the db version changes
request.onupgradeneeded = function(event) {
    // save reference to the db and create an object store called 'new_entry'
    const db = event.target.result;

    db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // save reference to db in global var when db is successfully created w its object store
    db = event.target.result;

    // check if app is online, if yes run uploadEntry() to send all local data to api
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// execute saveRecord() if no internet connection when a new entry is submitted
function saveRecord(record) {
    // open a new transaction with read/write permissions
    const transaction = db.transaction(['new_entry'], 'readwrite');
    // access object store for `new_entry`
    const entryObjectStore = transaction.objectStore('new_entry');
    // add record to store with .add method
    entryObjectStore.add(record);
};

function checkDatabase() {
    // open transaction to db, access object store, set all records from store to variable
    const transaction = db.transaction(['new_entry'], 'readwrite');
    const entryObjectStore = transaction.objectStore('new_entry');
    const getAll = entryObjectStore.getAll();

    // upon successful getAll()
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_entry'], 'readwrite');
                const entryObjectStore = transaction.objectStore('new_entry');
                // clear all items in store
                entryObjectStore.clear();

                alert('Entry has been submitted!');
            })
            .catch(err => console.log(err));
        }
    }
}

window.addEventListener('online', checkDatabase);