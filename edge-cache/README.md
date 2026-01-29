# Mini Edge Cache / CDN Simulator

## Overview

This project simulates the core behavior of a CDN and edge caching layer in front of a content delivery service, inspired by **Adobe Experience Manager (AEM) Cloud Service**. 

It demonstrates how edge caches handle HTTP requests, serve content from cache, and forward requests to an origin service when necessary. This helps reduce latency, protect backend systems, and scale content delivery globally.

---

## Key Features

- **Cache first:** Requests are served from the cache if available.
- **Cache misses:** Requests are forwarded to the origin service (Project 2: Content Service).
- **Cache variation:** Cache keys consider HTTP headers (e.g., `Accept-Language`) to support multi-language content.
- **TTL-based expiration:** Cached entries expire after a configurable time.
- **Origin shielding:** The edge cache prevents unnecessary load on the origin service.
- **Request logging:** Tracks requests, cache hits/misses, and response times.

---

## How It Works

1. **Client request** → Edge cache service.
2. **Cache check**:
   - If cache HIT → return cached response.
   - If cache MISS → forward to origin service.
3. **Store response in cache** for future requests (if cacheable).
4. **Return response to client** with headers:
   - `X-Cache: HIT` or `X-Cache: MISS`
   - Original origin headers preserved.

This flow mirrors how **CDNs like Fastly** work in AEM Cloud Service.

---

## Tech Stack

- Node.js + Express
- Axios (for proxying to origin)
- In-memory cache (Map)
- Middleware for logging and optional rate limiting
- Config-driven cache rules

---
