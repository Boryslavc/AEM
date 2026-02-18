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

function del(key){
    store.delete(key);
}

/** Remove all entries whose key starts with prefix (e.g. "GET:/pages/client1/..."). */
function delByPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

function clear(){
    store.clear();
}

module.exports = { get, set, del, delByPrefix, clear };