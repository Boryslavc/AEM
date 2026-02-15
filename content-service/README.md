# Content Service (AEM Publish Simulation)

Simulates AEM Publish instances serving **rendered HTML pages** for multiple clients in multiple languages.

## Multi-Tenant Architecture

```
pages/
├── client1/          # Enterprise Software
│   ├── en/
│   ├── de/
│   └── fr/
├── client2/          # E-commerce Retail
│   ├── en/
│   ├── de/
│   └── fr/
└── client3/          # Financial Services
    ├── en/
    ├── de/
    └── fr/
```

## Endpoints

```
GET /pages/:client/:lang/:pageName
GET /assets/:assetName
GET /health
```

## Examples

```bash
# Client1 - English
curl http://localhost:3000/pages/client1/en/home

# Client2 - German
curl http://localhost:3000/pages/client2/de/home

# Client3 - French
curl http://localhost:3000/pages/client3/fr/home
```

## Async Request Handling

All page requests are processed through a **task queue** with concurrency control (3 workers), simulating real AEM publish instance behavior under load.

## Cache Strategy

- **HTML pages**: 5 min TTL
- **Assets**: 24 hour TTL
- Headers: `X-Client`, `X-Language` for CDN routing

## Scale Simulation

- 3 clients × 3 languages (en, de, fr) = 9 site variants
- Demonstrates multi-tenant content delivery
- Realistic for AEM Cloud Service architecture
