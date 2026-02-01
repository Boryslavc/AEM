const store = new Map();

function get(key){
    const entry = store.get(key);
    if(!entry) return null;
    //TODO: event based cache invalidation
    if(entry.expiresAt < Date.now()){
        store.delete(key);
        return null;
    }

    return entry;
}

function set(key, value){
    store.set(key, value);
}

function clear(){
    store.clear();
}

module.exports = {get, set, clear};