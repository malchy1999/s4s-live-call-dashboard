const ICALL_API_ROOT = 'https://4reports.4com.im/api/v4';
const MIN_GAP_MS = 8000;
let lastRequestAt = 0;
let requestGate = Promise.resolve();

async function waitForGap() {
  const run = requestGate.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestAt;
    if (lastRequestAt > 0 && elapsed < MIN_GAP_MS) {
      await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
    }
    lastRequestAt = Date.now();
  });
  requestGate = run.catch(() => {});
  await run;
}

function getConfig() {
  const username = (process.env.TOLLRING_USERNAME || '').trim();
  const token = (process.env.TOLLRING_TOKEN || '').trim();
  if (!username || !token) return null;
  return { username, token };
}

function tollringRecords(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const direct = data.Data ?? data.Calls ?? data.calls;
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === 'object') {
    if (Array.isArray(direct.Calls)) return direct.Calls;
    if (Array.isArray(direct.calls)) return direct.calls;
  }
  return [];
}

async function callTollring(endpoint, method, body) {
  const config = getConfig();
  if (!config) {
    throw new Error('NOT_CONFIGURED');
  }

  await waitForGap();

  const auth = 'Basic ' + Buffer.from(config.username + ':' + config.token).toString('base64');
  const response = await fetch(`${ICALL_API_ROOT}/${endpoint}`, {
    method: method || 'GET',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('HTTP_' + response.status);
  }
  if (data.Result && data.Result.ErrorCode && data.Result.ErrorCode !== '0x0000') {
    throw new Error(data.Result.ErrorCode + ':' + (data.Result.Description || 'API error'));
  }

  return data;
}

async function getCallsForDateRange(startDate, endDate) {
  const body = {
    StartDate: `${startDate} 00:00:00`,
    EndDate: `${endDate} 23:59:59`,
    Directions: 'INC,IU,OUT'
  };
  const data = await callTollring('GetCallsByDate', 'POST', body);
  return tollringRecords(data);
}

module.exports = {
  getConfig,
  callTollring,
  getCallsForDateRange,
  tollringRecords
};
