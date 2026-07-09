const { callTollring, jsonResponse } = require('./lib/tollring');

exports.handler = async function (event) {
  if (process.env.DEMO_MODE === 'true') {
    return jsonResponse(503, { error: 'DEMO_MODE', message: 'Server demo mode enabled.' });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'METHOD_NOT_ALLOWED' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_) {
    return jsonResponse(400, { error: 'INVALID_BODY' });
  }

  if (!body.StartDate || !body.EndDate) {
    return jsonResponse(400, { error: 'MISSING_DATES', message: 'StartDate and EndDate are required.' });
  }

  const payload = {
    StartDate: body.StartDate,
    EndDate: body.EndDate,
    Directions: body.Directions || 'INC,IU,OUT',
  };

  return callTollring('/GetCallsByDate', 'POST', payload);
};
