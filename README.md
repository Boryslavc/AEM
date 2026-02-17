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
GET    /*  # Proxy all GET requests with caching
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

## Technology Stack

- **Runtime**: Node.js + Express
- **HTTP Client**: Axios
- **Logging**: Pino + Pino-HTTP
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Grafana Loki + Promtail
