# Mini AEM Cloud Delivery Pipeline

A simulation of **Adobe Experience Manager Cloud Service** content delivery: an origin (Content Service), an edge layer (Edge Cache), and optional logging (Loki + Promtail). The goal is to mirror real-world behavior: proper **HTTP cache semantics**, **conditional revalidation**, **multi-tenancy**, and **write-through invalidation** in one small stack.

What this demonstrates:

- **CDN-style pipeline:** Client → Edge Cache → Origin (Content Service) → Postgres. GETs are cached at the edge; PUT/POST/DELETE are forwarded and drive cache invalidation and optional push.
- **Cache state discipline:** The edge exposes explicit states (HIT, MISS, EXPIRED, REVALIDATED) and implements **ETag- and Last-Modified–based conditional requests**; TTL is inherited from the origin’s `Cache-Control` rather than hard-coded.
- **Multi-tenant, versioned content:** Content is keyed by client, language, and version (e.g. `client1/en/1.2.0/home`) with full CRUD and metadata (ETag, Cache-Control). A task queue limits concurrency to approximate publish-tier backpressure.
- **Write-through and invalidation:** When a client updates a page via the edge, the origin updates the page, then pushes the new content into the edge cache and the edge invalidates existing entries for that path—so the pipeline stays consistent without stale reads.

The mappings to real AEM building blocks (Fastly CDN, Dispatcher, Sling job queue, etc.) are summarized in [How this maps to AEM](#how-this-maps-to-aem) below.

---

## Architecture

```
                    ┌─────────────────┐
   Client           │   Edge Cache    │  GET: cache HIT/MISS/revalidate
   Request  ────────►│   (Port 4000)   │  PUT/POST/DELETE: forward → origin
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐     ┌──────────────┐
                    │ Content Service │────►│   Postgres   │
                    │  (Port 3000)    │     │   (5432)     │
                    └─────────────────┘     └──────────────┘
```

---

## What this demonstrates

**Edge cache**

- Implements **HTTP cache semantics**: conditional revalidation with `If-None-Match` (ETag) and `If-Modified-Since`; 304 responses refresh TTL without re-fetching body; 200 responses replace the cached entry.
- **TTL comes from the origin**: the edge parses `Cache-Control` (`s-maxage` / `max-age`) from the origin response instead of using fixed values, so pages and assets can have different lifetimes (e.g. 5 min vs 24h).
- **Explicit cache states** (see table below): every cached response is labeled HIT, MISS, EXPIRED, or REVALIDATED via the `X-Cache` header, so you can see exactly how the request was satisfied.

**Content service**

- **Multi-tenant, versioned content model**: clients × languages × versions × page names, with CRUD and metadata (ETag, Last-Modified, Cache-Control) suitable for cache negotiation.
- **Concurrency control**: a small task queue (e.g. 3 workers) to limit concurrent work and simulate publish-instance backpressure (analogous to Sling job processing).

**Cache states (edge)**

|      State      |                             Meaning                                                 |
|-----------------|-------------------------------------------------------------------------------------|
| **HIT**         | Served from cache; entry still within TTL.                                          |
| **MISS**        | No valid entry; fetched from origin and stored.                                     |
| **EXPIRED**     | Entry was past TTL, revalidated , origin returned cache updated, new content served |
| **REVALIDATED** | Entry was past TTL, origin detected no changes, new TTL served                      |

Check the `X-Cache` response header to see which state applied. More detail: [edge-cache README](edge-cache/README.md).

---

## How this maps to AEM

This simulation is intentionally aligned with AEM Cloud Service building blocks so the behavior is recognizable to anyone who has worked with the real stack.

|            This project               |                AEM equivalent                              |
|---------------------------------------|------------------------------------------------------------|
| Edge cache                            | **Fastly CDN** (edge caching, cache rules)                 |
| Conditional revalidation              | **Dispatcher** ETag/If-Modified-Sinceconditional requests  |
| TTL from origin Cache-Control         | **Dispatcher cache rules** / cache headers from publish    |
| Cache invalidation on write           | **Dispatcher flush agents** / publish → cache update       |
| Origin shielding                      | **Dispatcher** as reverse proxy in front of publish        |
| Write-through                         | **Publish → Dispatcher** cache update after content change |
| Multi-tenant                          | **Multiple sites, languages, content versions** in AEM     |
| Task queue, concurrency limit         | **Sling job queue**, backpressure on publish               |
| CRUD + metadata (ETag, Cache-Control) | **JCR/Sling** APIs, cache-related properties and headers   |

---

## Getting Started

**Prerequisites:** Docker and Docker Compose.

```bash
# 1. Clone the repo
git clone <repo-url>
cd aem

# 2. (Optional) Copy env and edit if needed — see "Environment variables" below
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Verify: request through edge cache (CDN)
curl http://localhost:4000/pages/client1/en/1.2.0/home

# 5. Check cache header (first call: MISS, second: HIT)
curl -I http://localhost:4000/pages/client1/en/1.2.0/home
```

**Direct origin (no cache):** `curl http://localhost:3000/pages/client1/en/1.2.0/home`

**Update a page through the edge:**  
`curl -X PUT http://localhost:4000/pages/client1/en/1.2.0/home -H "Content-Type: application/json" -d '{"html":"<h1>Updated</h1>"}'`

Service-level details: [content-service](content-service/README.md), [edge-cache](edge-cache/README.md).

---

## API Endpoints

**Content Service (port 3000)** — *authoritative API*

| Method |                  Path                     |  Description  |
|--------|-------------------------------------------|---------------|
| GET    | `/pages/:client/:lang/:version/:pageName` | Retrieve page |
| POST   | `/pages/:client/:lang/:version/:pageName` | Create page   |
| PUT    | `/pages/:client/:lang/:version/:pageName` | Update page   |
| DELETE | `/pages/:client/:lang/:version/:pageName` | Delete page   |
| GET    | `/health`                                 | Health check  |

**Content layout:** `pages/<client>/<lang>/<version>/<pageName>` (e.g. `client1`, `client2`, `client3`; `en`, `de`, `fr`; versions like `1.2.0`).

**Edge Cache (port 4000)** — proxies to content service

|      Method       |       Path        |                      Description                         |
|-------------------|-------------------|----------------------------------------------------------|
| GET               | `/*`              | Proxied with caching (HIT/MISS/REVALIDATED/EXPIRED)      |
| PUT, POST, DELETE | `/*`              | Forwarded to origin; cache for that path invalidated     |
| POST              | `/internal/cache` | Content-service pushes updated content (optional secret) |

---

## HTTP Caching

- **Cache-Control:** Pages typically `max-age=300` (5 min), `s-maxage=600` (10 min CDN). Assets can use longer TTL (e.g. 24h); edge uses the origin’s `Cache-Control` for TTL.
- **Revalidation:** Edge sends If-None-Match / If-Modified-Since; origin responds 304 (refresh TTL, keep serving cache) or 200 (update cache and serve).
- **Cache key:** URL path + query params (and optional Accept-Language).

**Write-through + push:** On successful PUT/POST via the edge, the content service updates the page and pushes the new content to the edge via `POST /internal/cache`. The edge also invalidates existing cache entries for that path. Optional: set `EDGE_CACHE_INTERNAL_SECRET` / `INTERNAL_API_SECRET` (same value) to protect `/internal/cache`.

---


## Monitoring (Loki)

With Docker Compose, Loki (3100) and Promtail run automatically.

```bash
# Cache misses from edge-cache
curl -G http://localhost:3100/loki/api/v1/query_range \
  --data-urlencode 'query={container_name="edge-cache"} |= "MISS"'

# Errors from content-service
curl -G http://localhost:3100/loki/api/v1/query_range \
  --data-urlencode 'query={container_name="content-service"} | json | level="error"'
```

---

## Kubernetes

Manifests in **`k8s/`**: namespace, Postgres (Secret, PVC, Deployment, Service), Content Service and Edge Cache (Deployments, Services), Ingress.

```bash
# Build images for your cluster (see k8s/README.md for minikube/kind)
kubectl apply -f k8s/
kubectl -n aem port-forward svc/edge-cache 4000:4000
curl http://localhost:4000/pages/client1/en/1.2.0/home
```

See **[k8s/README.md](k8s/README.md)** for image build/load and Ingress setup.

---

## Technology stack

Node.js, Express, Axios, Pino, Jest, Docker Compose, Kubernetes (basic), Grafana Loki + Promtail.
