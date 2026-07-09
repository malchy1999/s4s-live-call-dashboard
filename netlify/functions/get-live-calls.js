const { callTollring, jsonResponse } = require('./lib/tollring');

exports.handler = async function () {
  if (process.env.DEMO_MODE === 'true') {
    return jsonResponse(503, { error: 'DEMO_MODE', message: 'Server demo mode enabled.' });
  }
  return callTollring('/GetLiveCalls', 'GET');
};
