const listingPayload = {
  name: 'E2E Listing',
  address: '123 Test Street',
  description: 'Standalone e2e listing',
  monthlyRent: 500,
  bedrooms: 2,
  totalRooms: 3,
  bathrooms: 1,
  furnished: false,
  amenities: {
    solar: true,
    borehole: false,
    security: false,
    parking: false,
    internet: false,
  },
  imageUrls: ['https://example.com/img.jpg'],
  phoneNumber: '+263771234567',
  type: 'rent',
  offer: false,
  location: {
    province: 'TestCity',
    city: 'TestCity',
    addressLine: '123 Test Street',
    country: 'Zimbabwe',
    coordinates: {
      lat: null,
      lng: null,
    },
  },
};

async function run(state, api, assert, test) {
  await test('Create listing as landlord', async () => {
    const { status, body } = await api('POST', '/api/v1/listings', listingPayload, state.landlordToken);
    assert(status === 201, `expected 201, got ${status}`);
    assert(body && body.data && body.data.listing && body.data.listing.status === 'active', 'expected active listing');
    assert(body.data.listing._id, 'expected listing id');
    state.listingId = body.data.listing._id;
  });

  await test('Listing is active after create', async () => {
    const { status, body } = await api('GET', `/api/v1/listings/${state.listingId}`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.status === 'active', `expected active, got ${JSON.stringify(body)}`);
  });

  await test('1-listing limit enforced', async () => {
    const { status } = await api(
      'POST',
      '/api/v1/listings',
      { ...listingPayload, name: 'Second E2E Listing', address: '124 Test Street' },
      state.landlordToken
    );
    assert(status === 400 || status === 403, `expected 400 or 403, got ${status}`);
  });

  await test('Tenant cannot create listing', async () => {
    const { status } = await api(
      'POST',
      '/api/v1/listings',
      { ...listingPayload, name: 'Tenant Listing', address: '125 Test Street' },
      state.tenantToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test("Tenant cannot update landlord's listing", async () => {
    const { status } = await api(
      'PUT',
      `/api/v1/listings/${state.listingId}`,
      { name: 'Hacked' },
      state.tenantToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test("Tenant cannot delete landlord's listing", async () => {
    const { status } = await api(
      'DELETE',
      `/api/v1/listings/${state.listingId}`,
      undefined,
      state.tenantToken
    );
    assert(status === 403, `expected 403, got ${status}`);
  });

  await test('Update listing', async () => {
    const { status, body } = await api(
      'PUT',
      `/api/v1/listings/${state.listingId}`,
      { name: 'E2E Listing Updated' },
      state.landlordToken
    );
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && body.data && body.data.name === 'E2E Listing Updated', 'expected updated listing name');
  });

  await test('Get public listings feed', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
  });

  await test('Filter by location', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?location=TestCity');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((item) => {
        const locStr =
          typeof item.location === 'string'
            ? item.location.toLowerCase()
            : [item.location?.province, item.location?.city, item.location?.addressLine]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
        assert(locStr.includes('testcity'), 'location mismatch');
      });
    }
  });

  await test('Filter by minRent/maxRent', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?minRent=100&maxRent=99999');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((item) => {
        assert(item.monthlyRent >= 100 && item.monthlyRent <= 99999, 'monthlyRent out of range');
      });
    }
  });

  await test('Filter by minTotalRooms', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?minTotalRooms=1');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((item) => {
        assert(item.totalRooms >= 1, 'totalRooms below minimum');
      });
    }
  });

  await test('Filter by amenity (solar)', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?solar=true');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((item) => {
        assert(item.amenities && item.amenities.solar === true, 'solar amenity mismatch');
      });
    }
  });

  await test('Filter by searchTerm', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?searchTerm=E2E');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
  });

  await test('Filter by minBedrooms', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?minBedrooms=2');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((item) => {
        assert(item.bedrooms >= 2, 'bedrooms below minimum');
      });
    }
  });

  await test('Filter by furnished', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/get?furnished=true');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
  });

  await test('Get home highlighted', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/home/highlighted?limit=5');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
  });

  await test('Get grouped by location', async () => {
    const { status, body } = await api('GET', '/api/v1/listings/home/grouped-by-location');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body && Array.isArray(body.data), 'expected body.data array');
    if (body.data.length) {
      body.data.forEach((group) => {
        assert(group.location, 'expected group.location');
        assert(Array.isArray(group.listings), 'expected group.listings array');
      });
    }
  });

  if (!state.listingId) {
    throw new Error('Listings group: no listingId — cannot continue');
  }
}

module.exports = { run };
