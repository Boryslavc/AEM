# Content Service (AEM Publish Simulation)

A multi-tenant origin server simulating **AEM Publish instances**, serving versioned HTML pages with full CRUD operations, metadata management, and concurrency-controlled request processing.

---

## Core Features

### Multi-Tenant Architecture
- **3 clients**: Enterprise Software, Digital Agency, Financial Services
- **3 languages per client**: English (en), German (de), French (fr)
- **Versioned content**: Semantic versioning (e.g., 1.2.0, 2.1.0)
- **Isolated content**: Each client has separate content hierarchy

### Content Management
- **CRUD operations**: Create, Read, Update, Delete pages
- **Metadata tracking**: ETag, Last-Modified, Cache-Control per page
- **Atomic writes**: Exclusive file creation to prevent race conditions
- **Automatic cleanup**: Failed operations rollback file changes

### Performance & Scalability
- **Task queue**: Concurrency control with 3 worker threads
- **Async I/O**: Non-blocking file operations
- **Structured logging**: Pino logger with request/response tracking
- **Health checks**: `/health` endpoint for monitoring

---

## Directory Structure

```
data/pages/
├── client1/          # Enterprise Software
│   ├── en/
│   │   ├── 1.2.0/
│   │   │   ├── home.html
│   │   │   ├── home.meta.json
│   │   │   ├── about.html
│   │   │   └── about.meta.json
│   │   └── 2.1.0/
│   │       ├── products.html
│   │       └── products.meta.json
│   ├── de/
│   └── fr/
├── client2/          # Digital Agency
│   └── en/de/fr/
└── client3/          # Financial Services
    └── en/de/fr/
```

---

## API Endpoints

### Pages

```http
GET    /pages/:client/:lang/:version/:pageName
POST   /pages/:client/:lang/:version/:pageName
PUT    /pages/:client/:lang/:version/:pageName
DELETE /pages/:client/:lang/:version/:pageName
```

### Assets

```http
GET    /assets/:assetName
```

### Health

```http
GET    /health
```

---

## Usage Examples

### Retrieve Page

```bash
curl http://localhost:3000/pages/client1/en/1.2.0/home
```

**Response Headers:**
```
Content-Type: text/html
Cache-Control: public, max-age=300, s-maxage=600
ETag: "client1-en-1.2.0-home-1706012345678"
Last-Modified: Wed, 20 Jan 2024 14:30:00 GMT
X-Client: client1
X-Language: en
X-Version: 1.2.0
```

### Create Page

```bash
curl -X POST http://localhost:3000/pages/client1/en/1.3.0/contact \
  -H "Content-Type: application/json" \
  -H "Cache-Control: max-age=600" \
  -d '{"html": "<html><body>Contact Us</body></html>"}'
```

**Response:**
```json
{
  "message": "Page created",
  "path": "/client1/en/1.3.0/contact"
}
```

### Update Page

```bash
curl -X PUT http://localhost:3000/pages/client1/en/1.2.0/home \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body>Updated Home</body></html>"}'
```

### Delete Page

```bash
curl -X DELETE http://localhost:3000/pages/client1/en/1.2.0/home
```

---

## Metadata Schema

Each page has a `.meta.json` file:

```json
{
  "client": "client1",
  "language": "en",
  "version": "1.2.0",
  "pageName": "home",
  "contentType": "text/html",
  "cacheControl": "public, max-age=300, s-maxage=600",
  "createdAt": "2024-01-20T14:30:00.000Z",
  "etag": "\"client1-en-1.2.0-home-1706012345678\"",
  "lastModified": "2024-01-20T14:30:00.000Z"
}
```

---

## Task Queue

### Purpose
- Simulates real AEM Publish instance behavior under load
- Prevents resource exhaustion from concurrent requests
- Provides backpressure mechanism

### Configuration
- **Concurrency**: 3 worker threads
- **Max queue size**: 1000 tasks
- **Processing**: FIFO (First In, First Out)

### Implementation
```javascript
const { runTask } = require('./utils/taskQueue');

function getPage(req, res) {
    runTask(async () => {
        // File I/O operations
    }).catch(err => {
        // Error handling
    });
}
```

---

## Cache Strategy

### Pages
- **Browser cache**: 5 minutes (max-age=300)
- **CDN cache**: 10 minutes (s-maxage=600)
- **Validation**: ETag + Last-Modified headers

### Assets
- **Browser cache**: 24 hours (max-age=86400)
- **Immutable**: Long TTL for static resources

### Custom Headers
- `X-Client`: Client identifier for routing
- `X-Language`: Language code for localization
- `X-Version`: Content version for cache busting

---

## Error Handling

### 404 Not Found
- Page or asset doesn't exist
- Logged at debug level

### 400 Bad Request
- Missing HTML content in POST/PUT
- Page already exists (POST with exclusive flag)

### 500 Server Error
- File I/O failures
- Unexpected errors
- Logged at error level with full context

---

## Logging

### Structured Logs (Pino)
```json
{
  "level": "info",
  "time": 1706012345678,
  "msg": "Page created successfully",
  "filePath": "/data/pages/client1/en/1.2.0/home.html",
  "metaPath": "/data/pages/client1/en/1.2.0/home.meta.json"
}
```

### HTTP Request Logging
- Method, URL, status code
- Response time
- Request/response size

---

## Testing

```bash
npm test
```

### Test Coverage
- **Read operations**: GET pages, 404 handling
- **Write operations**: POST, PUT, DELETE
- **Concurrency**: Task queue behavior
- **Error scenarios**: Missing files, invalid input

---

## Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build
docker build -t content-service .

# Run
docker run -p 3000:3000 content-service
```

---

## Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

---

## Relevance to AEM

| Feature | AEM Equivalent |
|---------|----------------|
| Multi-tenant structure | Multiple sites in AEM |
| Language folders | Language masters (i18n) |
| Versioning | Content versions in JCR |
| Metadata files | JCR properties (jcr:content) |
| Task queue | Sling job queue |
| Cache headers | Dispatcher cache rules |
| CRUD operations | JCR API / Sling POST servlet |

---

## Dependencies

```json
{
  "express": "^5.2.1",
  "dotenv": "^17.3.1",
  "pino": "^10.3.0",
  "pino-http": "^11.0.0"
}
```
