# Edge Cache (CDN Simulation)

A production-grade CDN simulation implementing intelligent caching, conditional requests, and cache revalidation strategies inspired by **Fastly CDN** in Adobe Experience Manager Cloud Service.

---

## Core Features

### Intelligent Caching
- **Cache key generation**: URL-based with query parameter support
- **TTL management**: Configurable per content type
  - Pages: 5 minutes (300,000ms)
  - Assets: 24 hours (86,400,000ms)
  - Default: 5 seconds (5,000ms)
- **Automatic expiration**: Time-based cache invalidation

### Cache Revalidation
- **Conditional requests**: If-None-Match (ETag) and If-Modified-Since
- **304 Not Modified**: Refresh TTL without re-fetching content
- **Stale content handling**: Revalidate expired entries before serving

### Cache States
- **HIT**: Content served from cache (not expired)
- **MISS**: No cached entry, fetch from origin
- **EXPIRED**: Cached entry expired, revalidate with origin
- **REVALIDATED**: Origin confirmed content unchanged (304 response)

### Origin Shielding
- Reduces backend load by serving cached content
- Batches revalidation requests
- Protects origin from traffic spikes

---

## Architecture

```
Client Request
      ↓
  Edge Cache (Port 4000)
      ↓
  Cache Check
   /     \
 HIT    MISS/EXPIRED
  ↓         ↓
Return   Origin Request (Port 3000)
 Cache        ↓
          Store & Return
```

---

## How It Works

### 1. Cache HIT Flow
```
Client → Edge Cache
         ↓
    Check cache key
         ↓
    Entry found & valid
         ↓
    Return cached content
    X-Cache: HIT
```

### 2. Cache MISS Flow
```
Client → Edge Cache
         ↓
    Check cache key
         ↓
    No entry found
         ↓
    Fetch from origin
         ↓
    Store in cache
         ↓
    Return content
    X-Cache: MISS
```

### 3. Cache EXPIRED Flow (Revalidation)
```
Client → Edge Cache
         ↓
    Check cache key
         ↓
    Entry found but expired
         ↓
    Send conditional request
    (If-None-Match: ETag)
         ↓
    Origin responds:
    - 304 → Refresh TTL, serve cached (X-Cache: REVALIDATED)
    - 200 → Update cache, serve new (X-Cache: EXPIRED)
```

---

## API

### Proxy Endpoint

```http
GET /*  # All GET requests are proxied with caching
```

### Response Headers

```
X-Cache: HIT | MISS | EXPIRED | REVALIDATED
```

---

## Usage Examples

### First Request (Cache MISS)

```bash
curl -I http://localhost:4000/pages/client1/en/1.2.0/home
```

**Response:**
```
HTTP/1.1 200 OK
X-Cache: MISS
Content-Type: text/html
Cache-Control: public, max-age=300, s-maxage=600
ETag: "client1-en-1.2.0-home-1706012345678"
```

### Second Request (Cache HIT)

```bash
curl -I http://localhost:4000/pages/client1/en/1.2.0/home
```

**Response:**
```
HTTP/1.1 200 OK
X-Cache: HIT
Content-Type: text/html
```

### After TTL Expiration (Revalidation)

```bash
# Wait 5+ minutes, then request again
curl -I http://localhost:4000/pages/client1/en/1.2.0/home
```

**Edge sends to origin:**
```
GET /pages/client1/en/1.2.0/home
If-None-Match: "client1-en-1.2.0-home-1706012345678"
If-Modified-Since: Wed, 20 Jan 2024 14:30:00 GMT
```

**If content unchanged:**
```
HTTP/1.1 200 OK
X-Cache: REVALIDATED
```

**If content changed:**
```
HTTP/1.1 200 OK
X-Cache: EXPIRED
ETag: "client1-en-1.2.0-home-1706012399999"
```

---

## Cache Rules

### Cacheability Check

```javascript
function isCacheable(req) {
    if (req.method !== "GET") return false;
    if (req.originalUrl.startsWith("/health")) return false;
    return true;
}
```

### TTL Configuration

```javascript
function getTTL(req) {
    if (req.originalUrl.includes("/pages/")) return 300_000;    // 5 min
    if (req.originalUrl.includes("/assets/")) return 86400_000; // 24 hours
    return 5000;                                                 // 5 sec default
}
```

---

## Cache Key Generation

### Current Implementation

```javascript
function buildCacheKey(req) {
    return req.originalUrl; // URL path + query params
}
```

### Examples

```
/pages/client1/en/1.2.0/home → "pages:client1:en:1.2.0:home"
/pages/client1/en/1.2.0/home?preview=true → "pages:client1:en:1.2.0:home?preview=true"
/assets/style.css → "assets:style.css"
```

### Future Enhancement: Header-Based Variation

```javascript
// Support Accept-Language, Accept-Encoding, etc.
function buildCacheKey(req) {
    const url = req.originalUrl;
    const lang = req.get('Accept-Language');
    const encoding = req.get('Accept-Encoding');
    return `${url}:${lang}:${encoding}`;
}
```

---

## Cache Storage

### In-Memory Cache Structure

```javascript
{
  "cacheKey": {
    "data": "<html>...</html>",
    "expiresAt": 1706012645678,
    "etag": "\"client1-en-1.2.0-home-1706012345678\"",
    "lastModified": "Wed, 20 Jan 2024 14:30:00 GMT"
  }
}
```

### Cache Operations

```javascript
const cache = require('./cache/memoryCache');

// Get entry (returns null if expired)
const entry = cache.get(key);

// Set entry
cache.set(key, {
    data: response.data,
    expiresAt: Date.now() + ttl,
    etag: response.headers['etag'],
    lastModified: response.headers['last-modified']
});

// Clear all entries
cache.clear();
```

---

## Origin Client

### Request Handling

```javascript
const axios = require('axios');
const BASE_URL = process.env.ORIGIN || "http://localhost:3000";

async function sendRequestToOrigin(req, conditionalHeaders = {}) {
    const response = await axios.get(`${BASE_URL}${req.originalUrl}`, {
        headers: conditionalHeaders,
        validateStatus: (status) => status < 500
    });
    return response;
}
```
