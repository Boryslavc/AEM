# Mini AEM Cloud Delivery Pipeline

A production-ready simulation of **Adobe Experience Manager Cloud Service** content delivery architecture, combining:

1. **Content Service** – Multi-tenant origin server with CRUD operations and versioning
2. **Edge Cache** – CDN layer with intelligent caching, revalidation, and cache key generation
3. **Monitoring Stack** – Loki + Promtail for centralized logging

---

## Core Features

### Content Service (Origin)
- **Multi-tenant architecture**: 3 clients × 3 languages × versioned content
- **CRUD operations**: Full REST API for page management
- **Content versioning**: Semantic versioning (e.g., 1.2.0, 2.1.0)
- **Metadata management**: ETag, Last-Modified, Cache-Control headers
- **Task queue**: Concurrency-controlled request processing (3 workers)
- **Structured logging**: Pino logger with HTTP request tracking

### Edge Cache (CDN)
- **Intelligent caching**: URL-based cache key generation
- **Cache revalidation**: Conditional requests with If-None-Match/If-Modified-Since
- **TTL management**: Configurable per content type (pages: 5min, assets: 24h)
- **Cache states**: HIT, MISS, EXPIRED, REVALIDATED
- **Origin shielding**: Reduces backend load through efficient caching
- **Write-through caching**: When a client updates a page (PUT/POST) via the edge, the content service updates the page and pushes the new content to the edge cache so subsequent GETs are served from cache without a round-trip to the origin. Cache entries for that path are also invalidated on write so stale data is never served.

### Monitoring
- **Loki**: Log aggregation and storage
- **Promtail**: Docker log collection from all services
- **Structured logs**: JSON format for easy querying

---

## Quick Start

```bash
# Start all services
docker-compose up -d

# Test content delivery through edge cache
curl http://localhost:4000/pages/client1/en/1.2.0/home

# Direct origin access
curl http://localhost:3000/pages/client1/en/1.2.0/home

# Check cache status (look for X-Cache header)
curl -I http://localhost:4000/pages/client1/en/1.2.0/home

# Update a page through the edge cache; content service updates and pushes to edge cache
curl -X PUT http://localhost:4000/pages/client1/en/1.2.0/home \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Updated Home</h1>"}'
# Next GET to the same URL can be served from cache (X-Cache: HIT)
```

---

## Content Structure

```
pages/
├── client1/ (Enterprise Software)
│   ├── en/ → home (v1.2.0), about (v1.0.0), products (v2.1.0)
│   ├── de/ → home, about, products
│   └── fr/ → home, about, products
├── client2/ (Digital Agency)
│   └── en/de/fr/ → home (v3.0.1)
└── client3/ (Financial Services)
    └── en/de/fr/ → home (v1.5.2)
```

Each page includes:
- HTML content
- Metadata file (.meta.json) with caching directives
- Version tracking
- ETag for cache validation

---

## API Endpoints

### Content Service (Port 3000)
```
GET    /pages/:client/:lang/:version/:pageName  # Retrieve page
POST   /pages/:client/:lang/:version/:pageName  # Create page
PUT    /pages/:client/:lang/:version/:pageName  # Update page
DELETE /pages/:client/:lang/:version/:pageName  # Delete page
GET    /assets/:assetName                       # Retrieve asset
GET    /health                                   # Health check
```

### Edge Cache (Port 4000)
```
GET    /*              # Proxy all requests; GET with caching, PUT/POST/DELETE forwarded to origin
POST   /internal/cache # Internal: content-service pushes updated page content (optional secret via X-Internal-Secret)
```

---

## HTTP Caching Strategy

### Cache-Control Headers
- **Pages**: `public, max-age=300, s-maxage=600` (5min browser, 10min CDN)
- **Assets**: `public, max-age=86400` (24 hours)
- **Dynamic content**: Varies by client and page type

### Cache Revalidation
1. Edge cache checks expiration
2. Sends conditional request with ETag/Last-Modified
3. Origin responds:
   - `304 Not Modified` → Refresh TTL, serve cached content
   - `200 OK` → Update cache with new content

### Cache Key Generation
Based on: URL path + query parameters (header-based variation can be added)

### Cache update on write (write-through + push)
1. Client sends **PUT** or **POST** to the edge cache (e.g. `PUT /pages/client1/en/1.2.0/home` with JSON body).
2. Edge cache forwards the request to the content service (method and body preserved).
3. Content service updates the page and responds with success.
4. Content service then **pushes** the new content to the edge cache via `POST /internal/cache` (path, body, ETag, Cache-Control). The next GET for that URL can be served from cache without hitting the origin.
5. Edge cache also **invalidates** any existing cache entries for that path when it receives a successful PUT/POST/DELETE from the origin, so stale entries are never served.

Optional: set `EDGE_CACHE_INTERNAL_SECRET` and `INTERNAL_API_SECRET` (same value) so that only the content service can call the edge cache’s internal cache endpoint.

---

## Key Concepts Demonstrated

### Multi-Tenancy
- Multiple clients sharing infrastructure
- Isolated content per client
- Language-specific content delivery

### Content Versioning
- Semantic versioning for content releases
- Version-specific URLs for cache busting
- Metadata tracking per version

### HTTP Caching
- Cache hits/misses/revalidation
- TTL-based expiration
- Conditional requests (304 responses)
- ETag and Last-Modified validation

### Scalability Patterns
- Task queue for concurrency control
- Origin shielding via edge cache
- Stateless service design

---

## Monitoring & Observability

- **Loki UI**: http://localhost:3100
- **Structured logs**: All services emit JSON logs
- **Request tracking**: HTTP method, URL, status, response time
- **Cache metrics**: Hit/miss ratio visible in logs

---

## Kubernetes (basic orchestration)

A minimal Kubernetes setup is in the **`k8s/`** directory: namespace, Postgres (Secret, PVC, Deployment, Service), Content Service and Edge Cache (Deployments and Services), and an Ingress so you can run the stack on any cluster (minikube, kind, GKE, etc.).

```bash
# Build images and deploy (see k8s/README.md for cluster-specific steps)
kubectl apply -f k8s/
# Access via port-forward or Ingress
kubectl -n aem port-forward svc/edge-cache 4000:4000
```

See **[k8s/README.md](k8s/README.md)** for image build/load instructions and Ingress controller setup.

---

## Technology Stack

- **Runtime**: Node.js + Express
- **HTTP Client**: Axios
- **Logging**: Pino + Pino-HTTP
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (basic manifests in `k8s/`)
- **Monitoring**: Grafana Loki + Promtail
