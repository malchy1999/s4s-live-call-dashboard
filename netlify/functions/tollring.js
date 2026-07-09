const MIN_GAP_MS = 6000;
let lastRequestAt = 0;

async function waitForGap() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (lastRequestAt > 0 && elapsed < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

exports.handler = async (event) => {
  const ICALL_API_ROOT = 'https://4reports.4com.im/api/v4';

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // Build auth header from env vars
  const username = process.env.TOLLRING_USERNAME;
  const token    = process.env.TOLLRING_TOKEN;

  if (!username || !token) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Missing TOLLRING_USERNAME or TOLLRING_TOKEN environment variables'
      })
    };
  }

  const auth = 'Basic ' + Buffer.from(username + ':' + token).toString('base64');

  // Get the API path from query string
  const path = event.queryStringParameters?.path;

  if (!path) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing path parameter' })
    };
  }

  const method = event.httpMethod === 'POST' ? 'POST' : 'GET';

  try {
    await waitForGap();

    const response = await fetch(`${ICALL_API_ROOT}/${path}`, {
      method,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: method === 'POST' ? event.body : undefined
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Proxy failed to reach Tollring API',
        detail: err.message
      })
    };
  }
};
