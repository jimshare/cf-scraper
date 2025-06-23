# Cloudflare Scraper

Cloudflare Worker that scrapes text from a public webpage, accessible via front-end JavaScript.

## Usage Examples

- https://your-worker.domain.workers.dev/?url=https://example.com
- https://your-worker.domain.workers.dev/?url=https://news.ycombinator.com

## Response Format

```
{
  "url": "https://example.com",
  "contentType": "text/html; charset=utf-8",
  "text": "Extracted text content here...",
  "length": 1234
}
```

## To Deploy This Worker

- Log into your Cloudflare dashboard
- Go to Workers & Pages
- Create a new Worker
- Replace the default code with this implementation
- Deploy and test with your URLs