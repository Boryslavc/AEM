# Edge Cache (CDN Simulation)

CDN layer for the [Mini AEM Cloud Delivery Pipeline](../README.md): caching, conditional revalidation, and origin shielding. The main README has the [cache states table](../README.md#what-this-demonstrates) and [how this maps to AEM](../README.md#how-this-maps-to-aem); API, write-through flow, and env vars are there too.

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

## Cache states

Same table as in the [main README](../README.md#what-this-demonstrates):

|     State       |                                   Meaning                                                |
|-----------------|------------------------------------------------------------------------------------------|
| **HIT**         | Served from cache; entry still within TTL.                                               |
| **MISS**        | No valid entry; fetched from origin and stored.                                          |
| **EXPIRED**     | Entry past TTL; revalidated; origin returned 200 → cache updated.                        |
| **REVALIDATED** | Entry past TTL; revalidated; origin returned 304 → TTL refreshed, cached content served. |

Check the `X-Cache` response header to see which state applied.

---

## TTL and cacheability

- **TTL:** Taken from the origin response `Cache-Control` (`s-maxage` or `max-age`). If missing, default is 5 minutes. Assets can use longer TTL (e.g. 24h) when the origin sends it.
- **Cacheable:** Only GET requests; `/health` is excluded. PUT/POST/DELETE are forwarded to the origin and invalidate the cache for that path.


---

## Cache key and storage

Cache key: `method:path:lang=<Accept-Language>`. Stored per entry: `data`, `expiresAt`, `etag`, `lastModified` (for conditional requests).

---

## Relevance to AEM

The full mapping (Fastly CDN, Dispatcher, flush agents, etc.) is in the [main README — How this maps to AEM](../README.md#how-this-maps-to-aem). This service corresponds to the edge-cache and write-through rows there.

---

## Local run and tests

```bash
npm install
npm start   # ORIGIN=http://localhost:3000
npm test
```

Environment variables: see [Environment variables](../README.md#environment-variables) in the main README.
