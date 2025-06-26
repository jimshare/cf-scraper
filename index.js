export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      // Parse the URL and get the target URL parameter
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get('url');

      // Validate that a URL parameter was provided
      if (!targetUrl) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing URL parameter. Usage: ?url=https://example.com' 
          }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Validate that the URL is properly formatted
      let validatedUrl;
      try {
        validatedUrl = new URL(targetUrl);
        // Only allow HTTP and HTTPS protocols for security
        if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.' 
          }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Fetch the webpage
      const response = await fetch(validatedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
        },
        // Set a timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 seconds
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
          }), 
          { 
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Get the content type to handle different response types
      const contentType = response.headers.get('content-type') || '';
      
      // Check if it's HTML content
      if (contentType.includes('text/html')) {
        const html = await response.text();
        
        // Extract text content from HTML (basic text extraction)
        // Remove script and style elements
        let textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          // Add line breaks for block elements before removing tags
          .replace(/<\/?(p|div|h[1-6]|li|br|hr|blockquote|pre|section|article|header|footer|nav|aside)[^>]*>/gi, '\n')
          .replace(/<[^>]*>/g, ' ') // Remove remaining HTML tags
          .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs but preserve line breaks
          .replace(/\n\s*/g, '\n') // Clean up line breaks (remove spaces after them)
          .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to maximum of 2
          .trim();

        return new Response(
          JSON.stringify({ 
            url: targetUrl,
            contentType: contentType,
            text: textContent,
            length: textContent.length
          }), 
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else if (contentType.includes('text/')) {
        // Handle plain text content
        const textContent = await response.text();
        
        return new Response(
          JSON.stringify({ 
            url: targetUrl,
            contentType: contentType,
            text: textContent,
            length: textContent.length
          }), 
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else {
        // Non-text content
        return new Response(
          JSON.stringify({ 
            error: `Content type ${contentType} is not supported. Only text-based content can be extracted.` 
          }), 
          { 
            status: 415,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

    } catch (error) {
      // Handle any unexpected errors
      return new Response(
        JSON.stringify({ 
          error: `An error occurred: ${error.message}` 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};