CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    client VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,
    version VARCHAR(20) NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    html_content TEXT NOT NULL,
    cache_control VARCHAR(200) DEFAULT 'max-age=300',
    etag VARCHAR(200) NOT NULL,
    last_modified TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(client, language, version, page_name)
);

CREATE INDEX IF NOT EXISTS idx_pages_lookup ON pages(client, language, version, page_name);
