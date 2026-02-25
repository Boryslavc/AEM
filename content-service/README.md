# Content Service (AEM Publish Simulation)

Multi-tenant origin server for the [Mini AEM Cloud Delivery Pipeline](../README.md): versioned HTML pages, CRUD, metadata (ETag, Cache-Control), and task queue. API, caching, and env vars are in the **main [README](../README.md)**. The main README also has [how this project maps to AEM](../README.md#how-this-maps-to-aem) (Sling job queue, JCR, Dispatcher cache rules, etc.).

---

## Core features

- **Multi-tenant:** Clients × languages × versions (e.g. client1/en/1.2.0/home).
- **CRUD:** Create, read, update, delete pages via REST; content stored in **PostgreSQL** (schema in `db/schema.sql`).
- **Metadata:** ETag, Last-Modified, Cache-Control per page; health check at `/health`.
- **Task queue:** Concurrency limit (3 workers) and backpressure; see `utils/taskQueue.js`.
- **Edge cache push:** After successful create/update, the service pushes the new content to the edge cache (see main README).

---

## Logical content structure

```
pages/
  client1/ (e.g. Enterprise Software)
    en/, de/, fr/  →  version (e.g. 1.2.0)  →  pageName (home, about, products)
  client2/
  client3/
```

Stored in the database; no filesystem hierarchy. Seed data or migrations can populate initial pages.

---

## Task queue

- **Purpose:** Limit concurrency and simulate AEM Publish behavior under load.
- **Config:** 3 workers, configurable max queue size.
- **Usage:** All page I/O runs inside `runTask(async () => { ... })`; see `controllers/pageController.js`.

---

## Error handling

- **404:** Page not found.
- **400:** Missing `html` in POST/PUT, or duplicate page on POST.
- **500:** DB or unexpected errors; logged with context.

---

## Relevance to AEM

The full mapping (multi-tenant, Sling job queue, JCR, Dispatcher cache rules) is in the [main README — How this maps to AEM](../README.md#how-this-maps-to-aem). This service corresponds to the content-service / publish-side rows there.

---

## Local run and tests

```bash
npm install
# Set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/aem_content)
npm start
npm test
```

Environment variables: see [Environment variables](../README.md#environment-variables) in the main README.
