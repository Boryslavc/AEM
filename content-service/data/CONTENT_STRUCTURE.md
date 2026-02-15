# Content Data Structure Documentation

## Overview
This document describes the organization and structure of HTML content and metadata for the AEM Cloud Delivery Pipeline simulation.

---

## Directory Structure

```
data/pages/
├── client1/          # Enterprise software company
│   ├── en/           # English content
│   ├── de/           # German content (Deutsch)
│   └── fr/           # French content (Français)
├── client2/          # Digital agency
│   ├── en/
│   ├── de/
│   └── fr/
└── client3/          # Financial services
    ├── en/
    ├── de/
    └── fr/
```

---

## Clients

### Client1 - Enterprise Solutions
- **Industry:** Enterprise Software
- **Pages:** home, about, products
- **Languages:** en, de, fr
- **Content Focus:** B2B enterprise software solutions, CRM, ERP, cloud platforms
- **Cache Strategy:** Moderate caching (300-600s for home, 600-1200s for about, 180-300s for products)

### Client2 - Digital Agency
- **Industry:** Creative Services
- **Pages:** home
- **Languages:** en, de, fr
- **Content Focus:** Design and development services, creative solutions
- **Cache Strategy:** Shorter TTL (240-480s) due to frequent updates

### Client3 - Financial Services
- **Industry:** Banking & Finance
- **Pages:** home
- **Languages:** en, de, fr
- **Content Focus:** Secure banking solutions, financial services
- **Cache Strategy:** Longer TTL (600-900s) for stability

---

## Content Versioning

Each page has different versions reflecting content updates:

| Client  |   Page   | Version | Last Update |
|---------|----------|---------|-------------|
| client1 | home     |  1.2.0  | 2024-01-20  |
| client1 | about    |  1.0.0  | 2024-01-18  |
| client1 | products |  2.1.0  | 2024-01-22  |
| client2 | home     |  3.0.1  | 2024-01-21  |
| client3 | home     |  1.5.2  | 2024-01-23  |

---

## Metadata Schema

Each `.meta.json` file contains HTTP caching and content metadata:

```json
{
  "client": "string",           // Client identifier
  "language": "string",          // ISO 639-1 language code (en, de, fr)
  "pageName": "string",          // Page identifier
  "version": "string",           // Semantic version (major.minor.patch)
  "contentType": "string",       // MIME type (text/html)
  "cacheControl": "string",      // HTTP Cache-Control header value
  "lastModified": "string",      // ISO 8601 timestamp
  "etag": "string",              // Entity tag for cache validation
  "author": "string",            // Content author/team
  "publishDate": "string"        // ISO 8601 publish timestamp
}
```

### Cache-Control Values

- **Home pages:** `public, max-age=240-600, s-maxage=480-900`
  - Varies by client update frequency
  - Shorter for dynamic clients (client2)
  - Longer for stable clients (client3)

- **About pages:** `public, max-age=600, s-maxage=1200`
  - Longer TTL (rarely changes)

- **Product pages:** `public, max-age=180, s-maxage=300`
  - Shorter TTL (frequent updates)

### Cache-Control Directives Explained

- `public` - Can be cached by any cache (CDN, browser)
- `max-age` - Browser cache TTL in seconds
- `s-maxage` - Shared cache (CDN) TTL in seconds

---

## Language Support

### English (en)
- Primary language for all clients
- Full page coverage

### German (de)
- Localized content with German translations
- Maintains same structure as English

### French (fr)
- Localized content with French translations
- Maintains same structure as English

---

## Content Variations

### Client1 Variations
- **Home:** Enterprise-focused messaging, professional tone
- **About:** Company history, global reach (500+ companies)
- **Products:** Two main offerings (Enterprise Suite, Cloud Platform)

### Client2 Variations
- **Home:** Creative, modern messaging for digital agency
- Different brand voice compared to client1

### Client3 Variations
- **Home:** Security-focused messaging for financial services
- Trust and reliability emphasis

---

## HTTP Caching Strategy

### Browser Cache (max-age)
- 180s - Frequently updated content (products)
- 240s - Dynamic content (client2 home)
- 300s - Standard content (client1 home)
- 600s - Stable content (about pages, client3 home)

### CDN Cache (s-maxage)
- 300s - Frequently updated content
- 480s - Dynamic content
- 600s - Standard content
- 900s - Stable content
- 1200s - Rarely changing content

### ETag Format
`"{client}-{language}-{pageName}-v{version}"`

Example: `"client1-en-home-v1.2.0"`

---

## API Access Pattern

### URL Structure
```
GET /pages/{client}/{language}/{pageName}
```

### Examples
```
GET /pages/client1/en/home
GET /pages/client1/de/about
GET /pages/client2/fr/home
GET /pages/client3/en/home
```

### Response Headers
```
Content-Type: text/html
Cache-Control: public, max-age=300, s-maxage=600
Last-Modified: Wed, 20 Jan 2024 14:30:00 GMT
ETag: "client1-en-home-v1.2.0"
X-Client: client1
X-Language: en
```

---

## Content Update Workflow

1. **Content Team** updates HTML file
2. **Metadata** is updated with new:
   - `lastModified` timestamp
   - `version` number (if significant change)
   - `etag` value
3. **Cache Invalidation** occurs at edge layer
4. **New Content** is served with updated headers

---

## Cache Efficiency Considerations

### High Cache Hit Ratio
- About pages (rarely change)
- Client3 home (stable financial content)

### Moderate Cache Hit Ratio
- Client1 home (periodic updates)
- Standard content pages

### Lower Cache Hit Ratio
- Product pages (frequent updates)
- Client2 home (dynamic agency content)

---

## Future Enhancements

- [ ] Add more page types (contact, blog, services)
- [ ] Implement cache invalidation API
- [ ] Add content variants (A/B testing)
- [ ] Support additional languages (es, it, pt)
- [ ] Add JSON content API alongside HTML
- [ ] Implement conditional requests (If-Modified-Since, If-None-Match)


---

## Mirrors AEM Cloud Architecture

This structure simulates:
- **Multi-tenancy** (multiple clients)
- **Internationalization** (i18n with language variants)
- **Content versioning** (semantic versions)
- **HTTP caching** (Cache-Control, ETag, Last-Modified)
- **CDN behavior** (different TTLs for browser vs shared cache)

Similar to AEM Cloud Service where:
- Each client = AEM tenant/site
- Language folders = language masters
- Metadata = JCR properties
- Edge cache = Fastly CDN
- Content service = AEM Publish instances
