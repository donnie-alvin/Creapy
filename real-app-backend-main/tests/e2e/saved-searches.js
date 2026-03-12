async function run(state, api, assert, test) {
  let savedSearchId = null;

  await test('Landlord cannot create saved search', async () => {
    const { status } = await api(
      'POST',
      '/api/v1/saved-searches',
      { name: 'Test', criteria: {} },
      state.landlordToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test('Tenant creates saved search', async () => {
    const { status, body } = await api(
      'POST',
      '/api/v1/saved-searches',
      { name: 'Harare 2BR', criteria: { location: 'Harare', minBedrooms: 2 } },
      state.tenantToken
    );
    assert(status === 201, `expected 201, got ${status}`);
    assert(body && body.data && body.data._id, 'expected saved search id');
    savedSearchId = body.data._id;
  });

  await test('GET /mine returns the saved search', async () => {
    const { status, body } = await api('GET', '/api/v1/saved-searches/mine', undefined, state.tenantToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    assert(body.results >= 1, `expected results >= 1, got ${body && body.results}`);
    assert(body.data.some(item => item._id === savedSearchId), 'created savedSearchId not found in body.data');
  });

  await test('Landlord cannot list saved searches', async () => {
    const { status } = await api('GET', '/api/v1/saved-searches/mine', undefined, state.landlordToken);
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test('Delete saved search', async () => {
    const { status } = await api(
      'DELETE',
      `/api/v1/saved-searches/${savedSearchId}`,
      undefined,
      state.tenantToken
    );
    assert(status === 204, `expected 204, got ${status}`);
  });

  await test('GET /mine after delete', async () => {
    const { status, body } = await api('GET', '/api/v1/saved-searches/mine', undefined, state.tenantToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    assert(!body.data.some((item) => item._id === savedSearchId), 'deleted saved search still present');
  });
}

module.exports = { run };
