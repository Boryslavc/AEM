const store = new Map();

function get(key){
    const entry = store.get(key);
    if(!entry) return null;

    if(entry.expiresAt < Date.now){
        store.delete(key);
        return null;
    }

    return entry.data;
}

function set(key, value, ttl){
    store.set(key, {
        data: value,
        expiresAt: Date.now() + ttl
    })
}

module.exports = {get, set};