'use strict';

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const API_BASE = (
  process.env.SEED_API_BASE ||
  process.env.API_BASE ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');
const SEED_API_KEY = process.env.SEED_API_KEY || '';
const TARGET_LISTING_COUNT = 100;
const DEMO_PHONE = '+263771234567';

const SINGLE_ACTIVE_LISTING_MESSAGE =
  'You already have an active listing. You can only have one listing at a time.';

const IMAGES = [
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1780&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop',
];

const LOCATIONS = [
  {
    location: 'Borrowdale',
    rentMin: 1200,
    rentMax: 3000,
    descriptors: [
      'Executive Villa',
      'Luxury Estate',
      'Contemporary Manor',
      'Private Residence',
      'Garden Retreat',
      'Signature Home',
    ],
  },
  {
    location: 'Highlands',
    rentMin: 800,
    rentMax: 1800,
    descriptors: [
      'Spacious Home',
      'Garden Cottage',
      'Quiet Residence',
      'Family Haven',
      'Elegant Duplex',
      'Modern Retreat',
    ],
  },
  {
    location: 'Avondale',
    rentMin: 500,
    rentMax: 1100,
    descriptors: [
      'Modern Flat',
      'Cosy Townhouse',
      'Urban Apartment',
      'Central Suite',
      'Neat Residence',
      'Smart Loft',
    ],
  },
  {
    location: 'Kuwadzana',
    rentMin: 150,
    rentMax: 400,
    descriptors: [
      'Neat Cottage',
      'Family Home',
      'Corner House',
      'Practical Unit',
      'Secure Residence',
      'Sunny Retreat',
    ],
  },
  {
    location: 'Mbare',
    rentMin: 100,
    rentMax: 250,
    descriptors: [
      'Affordable Room',
      'Starter Unit',
      'Compact Home',
      'Budget Flat',
      'Simple Space',
      'City Base',
    ],
  },
  {
    location: 'Chitungwiza',
    rentMin: 120,
    rentMax: 350,
    descriptors: [
      'Comfortable House',
      'Twin Cottage',
      'Neighbourhood Home',
      'Family Residence',
      'Practical House',
      'Fresh Start Home',
    ],
  },
];

function requireFetch() {
  if (typeof fetch !== 'function') {
    throw new Error(
      'Global fetch is unavailable in this Node runtime. Use Node 18+ to run the seed script.'
    );
  }
}

async function request(method, path, body, token) {
  const headers = {};
  if (body != null) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (SEED_API_KEY) {
    headers['x-seed-api-key'] = SEED_API_KEY;
  }

  let payload;
  if (body != null) {
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
  });

  const raw = await res.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = { raw };
    }
  }

  if (!res.ok) {
    const error = new Error(
      `${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`
    );
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function requestForm(method, path, body, token) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (SEED_API_KEY) {
    headers['x-seed-api-key'] = SEED_API_KEY;
  }

  const params = new URLSearchParams();
  Object.entries(body || {}).forEach(([key, value]) => {
    if (value != null) {
      params.append(key, String(value));
    }
  });

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: params.toString(),
  });

  const raw = await res.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = { raw };
    }
  }

  if (!res.ok) {
    const error = new Error(
      `${method} ${path} failed (${res.status}): ${JSON.stringify(data)}`
    );
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

function buildLandlordSeedUsers() {
  return Array.from({ length: TARGET_LISTING_COUNT }, (_, index) => ({
    username: index === 0 ? 'demo_landlord' : `demo_landlord_${index + 1}`,
    email: index === 0 ? 'landlord@demo.com' : `landlord${index + 1}@demo.com`,
    password: 'demo1234',
    role: 'landlord',
  }));
}

async function ensureUser(user) {
  try {
    const login = await request('POST', '/api/v1/users/login', {
      email: user.email,
      password: user.password,
    });

    return {
      created: false,
      token: login.token,
      user: login?.data?.user,
    };
  } catch (error) {
    if (error.status && error.status !== 404 && error.status !== 401) {
      throw error;
    }
  }

  const signup = await request('POST', '/api/v1/users/signup', user);
  return {
    created: true,
    token: signup.token,
    user: signup?.data?.user,
  };
}

function buildListings() {
  const locationCounts = Array.from({ length: LOCATIONS.length }, () => 0);

  return Array.from({ length: TARGET_LISTING_COUNT }, (_, index) => {
    const locationIndex = index % LOCATIONS.length;
    const config = LOCATIONS[locationIndex];
    const localIndex = locationCounts[locationIndex];
    locationCounts[locationIndex] += 1;

    const descriptor = config.descriptors[localIndex % config.descriptors.length];
    const descriptorCycle = Math.floor(localIndex / config.descriptors.length);
    const descriptorLabel =
      descriptorCycle === 0 ? descriptor : `${descriptor} ${descriptorCycle + 1}`;
    const rentProgress =
      localIndex === 0 ? 0 : (localIndex % 10) / 9;
    const monthlyRent = Math.round(
      config.rentMin + (config.rentMax - config.rentMin) * rentProgress
    );
    const bedrooms = (index % 5) + 1;
    const bathrooms = (index % 3) + 1;

    return {
      name: `${config.location} ${descriptorLabel}`,
      address: `${10 + index * 7} ${descriptorLabel} Road, ${config.location}`,
      description: `${config.location} ${descriptorLabel} offers a well-kept rental with practical amenities and convenient access to daily essentials.`,
      monthlyRent,
      bedrooms,
      bathrooms,
      totalRooms: bedrooms + bathrooms + 1,
      furnished: index % 2 === 0,
      amenities: {
        solar: index % 2 === 0,
        borehole: index % 3 !== 1,
        security: index % 4 !== 0,
        parking: index % 3 !== 2,
        internet: index % 5 < 3,
      },
      imageUrls: [IMAGES[index % IMAGES.length], IMAGES[(index + 1) % IMAGES.length]],
      phoneNumber: DEMO_PHONE,
      type: 'rent',
      offer: false,
      studentAccommodation: index % 5 === 0,
      location: config.location,
    };
  });
}

async function getUsersListings(userId, token) {
  const response = await request('GET', `/api/v1/listings/user/${userId}`, null, token);
  return response?.data || [];
}

async function getListingById(listingId, token) {
  const response = await request(
    'GET',
    `/api/v1/listings/listing/${listingId}`,
    null,
    token
  );
  return response?.data || null;
}

async function ensurePermanentListing(listing, token) {
  if (!listing?._id) {
    return false;
  }

  if (listing.paymentDeadline == null && listing.status === 'active') {
    return false;
  }

  const payment = await request(
    'POST',
    '/api/v1/payments/listing-fee',
    { listingId: listing._id, phone: listing.phoneNumber || DEMO_PHONE },
    token
  );
  const transactionRef = payment?.data?.transactionRef;
  if (!transactionRef) {
    throw new Error(`No transactionRef returned for listing ${listing._id}`);
  }

  await requestForm(
    'POST',
    '/webhooks/payment',
    { reference: transactionRef, status: 'paid', hash: 'ignored' },
    null
  );

  const updatedListing = await getListingById(listing._id, token);
  if (updatedListing?.paymentDeadline != null || updatedListing?.status !== 'active') {
    throw new Error(
      `Listing ${listing._id} was not finalized as permanent. Check PAYMENT_PROVIDER/webhook configuration.`
    );
  }

  return true;
}

async function ensureListing(listing, token, userId, index, total) {
  try {
    const response = await request('POST', '/api/v1/listings', listing, token);
    process.stdout.write(`\r  Creating listings... ${index}/${total}`);
    return {
      created: true,
      listing: response?.data?.listing || null,
    };
  } catch (error) {
    const message =
      error?.payload?.message ||
      error?.payload?.errors?.[0]?.msg ||
      error.message;

    if (
      error.status === 400 &&
      typeof message === 'string' &&
      message.includes(SINGLE_ACTIVE_LISTING_MESSAGE)
    ) {
      process.stdout.write(`\r  Creating listings... ${index}/${total}`);
      const existingListings = await getUsersListings(userId, token);
      const existingListing =
        existingListings.find((item) => item.status !== 'inactive') ||
        existingListings[0] ||
        null;
      return {
        created: false,
        listing: existingListing,
      };
    }

    throw error;
  }
}

async function seed() {
  requireFetch();

  console.log(`\nSeeding via API: ${API_BASE}\n`);

  const landlordSeeds = buildLandlordSeedUsers();
  const listings = buildListings();

  let createdUsers = 0;
  const landlords = [];

  for (const landlord of landlordSeeds) {
    const result = await ensureUser(landlord);
    if (result.created) createdUsers += 1;
    landlords.push({
      token: result.token,
      user: result.user,
    });
  }

  const premiumTenant = await ensureUser({
    username: 'premium_tenant',
    email: 'premium@demo.com',
    password: 'demo1234',
    role: 'tenant',
  });
  if (premiumTenant.created) createdUsers += 1;

  const freeTenant = await ensureUser({
    username: 'free_tenant',
    email: 'tenant@demo.com',
    password: 'demo1234',
    role: 'tenant',
  });
  if (freeTenant.created) createdUsers += 1;

  console.log(`✓ ${createdUsers} demo users created or recovered`);

  let createdListings = 0;
  let permanentListings = 0;
  for (let index = 0; index < listings.length; index += 1) {
    const outcome = await ensureListing(
      listings[index],
      landlords[index].token,
      landlords[index].user?._id,
      index + 1,
      listings.length
    );
    if (outcome.created) createdListings += 1;
    if (outcome.listing) {
      const madePermanent = await ensurePermanentListing(
        outcome.listing,
        landlords[index].token
      );
      if (madePermanent) permanentListings += 1;
    }
  }

  console.log(`\n✓ ${createdListings} demo listings created`);
  console.log(`✓ ${permanentListings} listings finalized with unlimited lifetime`);
  console.log('\nDemo credentials:');
  console.log('  Landlord:        landlord@demo.com / demo1234');
  console.log('  Extra landlords: landlord2-100@demo.com / demo1234');
  console.log('  Premium tenant:  premium@demo.com / demo1234');
  console.log('  Free tenant:     tenant@demo.com / demo1234');
  console.log(
    '\nNote: premium@demo.com is created as a tenant account only. Premium activation still requires the payment/webhook flow.'
  );
  if (SEED_API_KEY) {
    console.log('Seed rate-limit bypass header enabled via SEED_API_KEY.\n');
  } else {
    console.log(
      'Configure SEED_API_KEY on both the backend and this script environment if you need to bypass API rate limits while seeding large datasets.\n'
    );
  }
}

seed().catch((error) => {
  console.error('\nSeed failed:', error.message);
  process.exit(1);
});
