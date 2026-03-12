async function run(state, api, assert, test) {
  let updatedLandlordToken = null;

  await test('GET /me as landlord', async () => {
    const { status, body } = await api('GET', '/api/v1/users/me', undefined, state.landlordToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.user && body.data.user.role === 'landlord', 'expected landlord role');
    assert(body.data.user._id === state.landlordId, 'expected landlord id match');
  });

  await test('GET /me as tenant', async () => {
    const { status, body } = await api('GET', '/api/v1/users/me', undefined, state.tenantToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.user && body.data.user.role === 'tenant', 'expected tenant role');
    assert(body.data.user._id === state.tenantId, 'expected tenant id match');
  });

  await test('Update landlord profile', async () => {
    const { status, body } = await api(
      'PUT',
      `/api/v1/users/update/${state.landlordId}`,
      {
        payload: {
          username: 'landlord_updated',
          email: `updated_${Date.now()}@test.creapy.com`,
          password: state.password,
          avatar: '',
        },
      },
      state.landlordToken
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.user && body.data.user.username === 'landlord_updated', 'expected updated username');
    assert(body.token, 'expected refreshed token');
    updatedLandlordToken = body.token;
    state.landlordToken = body.token;
  });

  await test('GET /me after update', async () => {
    const { status, body } = await api('GET', '/api/v1/users/me', undefined, updatedLandlordToken);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.user && body.data.user.username === 'landlord_updated', 'expected updated username');
  });
}

module.exports = { run };
