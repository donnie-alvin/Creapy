require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
});

const API_BASE = process.env.SEED_API_BASE || 'http://localhost:5000';

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const results = [];
let fatalGroupError = false;

const state = {
  landlordEmail: `landlord_${Date.now()}@test.creapy.com`,
  tenantEmail: `tenant_${Date.now()}@test.creapy.com`,
  landlordToken: null,
  landlordId: null,
  tenantToken: null,
  tenantId: null,
  listingId: null,
  listingFeeRef: null,
  tenantPremiumRef: null,
  password: 'TestPass123!',
};

async function api(method, path, body, token, formEncoded = false) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = formEncoded
      ? 'application/x-www-form-urlencoded'
      : 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : formEncoded
          ? new URLSearchParams(body).toString()
          : JSON.stringify(body),
  });

  let parsedBody = null;

  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  return { status: response.status, body: parsedBody };
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true, detail: '' });
    console.log(`${green('✓ PASS')}  ${name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, detail });
    console.log(`${red('✗ FAIL')}  ${name} — ${detail}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function printSummary() {
  const passed = results.filter((result) => result.passed).length;
  const skipped = results.filter((result) => result.skipped).length;
  const failed = results.filter((result) => !result.passed && !result.skipped).length;

  console.log('─────────────────────────────────────');
  console.log(`${passed}/${results.length} tests passed`);
  if (skipped > 0) {
    console.log(`${skipped} test(s) skipped`);
  }

  if (failed > 0) {
    console.log(`${failed} test(s) failed`);
    process.exit(1);
  }

  if (fatalGroupError) {
    console.log('Fatal group error encountered');
    process.exit(1);
  }
}

async function cleanup() {
  if (state.listingId && state.landlordToken) {
    try {
      await api('DELETE', `/api/v1/listings/${state.listingId}`, undefined, state.landlordToken);
    } catch {}
  }

  if (state.landlordId && state.landlordToken) {
    try {
      await api(
        'DELETE',
        `/api/v1/users/delete/${state.landlordId}`,
        undefined,
        state.landlordToken
      );
    } catch {}
  }

  if (state.tenantId && state.tenantToken) {
    try {
      await api('DELETE', `/api/v1/users/delete/${state.tenantId}`, undefined, state.tenantToken);
    } catch {}
  }
}

async function runTests() {
  console.log('Running Creapy API E2E Tests');
  console.log(`API: ${dim(API_BASE)}`);
  console.log('─────────────────────────────────────');

  try {
    const groups = [
      { name: 'Auth', module: require('./auth') },
      { name: 'Listings', module: require('./listings') },
      { name: 'Payments', module: require('./payments') },
      { name: 'Saved Searches', module: require('./saved-searches') },
      { name: 'Profile', module: require('./profile') },
    ];

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      try {
        await group.module.run(state, api, assert, test);
      } catch (err) {
        fatalGroupError = true;
        console.log(`\n[FATAL] ${group.name} group failed: ${err.message}`);
        for (const skippedGroup of groups.slice(index + 1)) {
          results.push({
            name: `${skippedGroup.name} group skipped due to fail-fast`,
            passed: false,
            skipped: true,
            detail: 'skipped after fatal group failure',
          });
        }
        console.log('Remaining groups skipped.');
        break;
      }
    }
  } finally {
    await cleanup();
    printSummary();
  }
}

runTests();
