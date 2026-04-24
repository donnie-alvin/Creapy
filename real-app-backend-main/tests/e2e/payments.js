async function run(state, api, assert, test) {
  await test('Initiate listing fee', async () => {
    const { status, body } = await api(
      'POST',
      '/api/v1/payments/listing-fee',
      { listingId: state.listingId, phone: '+263771234567' },
      state.landlordToken
    );
    assert(status === 200 || status === 201, `expected 200 or 201, got ${status}`);
    assert(body && body.data && body.data.transactionRef, 'expected listing fee transactionRef');
    state.listingFeeRef = body.data.transactionRef;
  });

  if (!state.listingFeeRef) {
    throw new Error('Payments group: no listingFeeRef — cannot continue');
  }

  await test('Listing is now pending_payment (hidden from tenant)', async () => {
    const { status } = await api(
      'GET',
      `/api/v1/listings/listing/${state.listingId}`,
      undefined,
      state.tenantToken
    );
    assert(status === 404, `expected 404, got ${status}`);
  });

  await test('Fire listing-fee webhook with earlyAccess=true', async () => {
    const { status, body } = await api(
      'POST',
      '/webhooks/payment?earlyAccess=true',
      { reference: state.listingFeeRef, status: 'paid', hash: 'ignored' },
      undefined,
      true
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.status === 'ok', `expected body.status=ok, got ${JSON.stringify(body)}`);
  });

  await test('early_access listing hidden from non-premium tenant', async () => {
    const { status } = await api(
      'GET',
      `/api/v1/listings/listing/${state.listingId}`,
      undefined,
      state.tenantToken
    );
    assert(status === 404, `expected 404, got ${status}`);
  });

  await test('Initiate tenant premium', async () => {
    const { status, body } = await api(
      'POST',
      '/api/v1/payments/tenant-premium',
      { phone: '+263771234567' },
      state.tenantToken
    );
    assert(status === 201, `expected 201, got ${status}`);
    assert(body && body.data && body.data.transactionRef, 'expected tenant premium transactionRef');
    state.tenantPremiumRef = body.data.transactionRef;
  });

  await test('Fire tenant-premium webhook', async () => {
    const { status, body } = await api(
      'POST',
      '/webhooks/payment',
      { reference: state.tenantPremiumRef, status: 'paid', hash: 'ignored' },
      undefined,
      true
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.status === 'ok', `expected body.status=ok, got ${JSON.stringify(body)}`);
  });

  await test('early_access listing visible to premium tenant', async () => {
    const { status, body } = await api(
      'GET',
      `/api/v1/listings/listing/${state.listingId}`,
      undefined,
      state.tenantToken
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.status === 'early_access', `expected early_access, got ${JSON.stringify(body)}`);
  });

  await test('Webhook idempotency', async () => {
    const { status, body } = await api(
      'POST',
      '/webhooks/payment?earlyAccess=true',
      { reference: state.listingFeeRef, status: 'paid', hash: 'ignored' },
      undefined,
      true
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.reason === 'already processed', `expected already processed, got ${JSON.stringify(body)}`);
  });

  await test('GET /payments/mine as landlord', async () => {
    const { status, body } = await api('GET', '/api/v1/payments/mine', undefined, state.landlordToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    assert(body.data.some((item) => item.type === 'listing_fee'), 'expected listing_fee payment');
    const listingFeePayment = body.data.find((item) => item.type === 'listing_fee');
    assert(listingFeePayment && listingFeePayment.listing && listingFeePayment.listing._id, 'expected listing._id on listing_fee payment');
  });

  await test('GET /payments/mine as tenant', async () => {
    const { status, body } = await api('GET', '/api/v1/payments/mine', undefined, state.tenantToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    assert(
      body.data.some((item) => item.type === 'premium_subscription'),
      'expected premium_subscription payment'
    );
  });

  await test('Tenant cannot initiate listing fee', async () => {
    const { status } = await api(
      'POST',
      '/api/v1/payments/listing-fee',
      { listingId: state.listingId, phone: '+263771234567' },
      state.tenantToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test('Landlord cannot initiate tenant premium', async () => {
    const { status } = await api(
      'POST',
      '/api/v1/payments/tenant-premium',
      { phone: '+263771234567' },
      state.landlordToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });
}

module.exports = { run };
