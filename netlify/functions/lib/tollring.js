function getConfig() {
  const username = process.env.TOLLRING_USERNAME;
  const token = process.env.TOLLRING_TOKEN;
  const base = (process.env.TOLLRING_BASE || '').replace(/\/$/, '');
  if (!username || !token || !base) return null;
  if (base.includes('your-host') || base.includes('YOUR_ICALLSUITE_HOST')) {
    return { misconfigured: true, base };
  }
  return { username, token, base };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

async function callTollring(endpoint, method, body) {
  const config = getConfig();
  if (!config) {
    return jsonResponse(503, { error: 'NOT_CONFIGURED', message: 'Tollring credentials are not set in Netlify environment variables.' });
  }
  if (config.misconfigured) {
    return jsonResponse(503, {
      error: 'NOT_CONFIGURED',
      message: 'TOLLRING_BASE is still set to the placeholder URL. Replace it with your real iCall Suite host, e.g. https://company.icallsuite.com/api/v4',
    });
  }

  const auth = Buffer.from(`${config.username}:${config.token}`).toString('base64');
  const url = `${config.base}${endpoint}`;

  const options = {
    method: method || 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    const cause = err.cause && err.cause.message ? err.cause.message : err.message;
    return jsonResponse(502, {
      error: 'UPSTREAM_ERROR',
      message: `Could not reach Tollring at ${config.base}. Check TOLLRING_BASE is your real iCall Suite URL. (${cause})`,
    });
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    return jsonResponse(502, { error: 'INVALID_RESPONSE', message: 'Tollring returned non-JSON data.' });
  }

  if (response.status === 401 || response.status === 403) {
    return jsonResponse(response.status, { error: 'AUTH_FAILED', message: 'Tollring rejected the credentials.' });
  }

  if (!response.ok) {
    return jsonResponse(response.status, { error: 'API_ERROR', message: data.message || `Tollring error ${response.status}` });
  }

  return jsonResponse(200, data);
}

module.exports = { callTollring, jsonResponse, getConfig };
