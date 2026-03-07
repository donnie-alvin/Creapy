'use strict';

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const API_BASE = (
  process.env.SEED_API_BASE ||
  process.env.API_BASE ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');

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

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
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
  const listingCount = LOCATIONS.reduce(
    (sum, config) => sum + config.descriptors.length,
    0
  );

  return Array.from({ length: listingCount }, (_, index) => ({
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
  return LOCATIONS.flatMap((config, locationIndex) =>
    config.descriptors.map((descriptor, step) => {
      const index = locationIndex * config.descriptors.length + step;
      const monthlyRent = Math.round(
        config.rentMin + (config.rentMax - config.rentMin) * (step / 5)
      );

      return {
        name: `${config.location} ${descriptor}`,
        address: `${10 + index * 7} ${descriptor} Road, ${config.location}`,
        description: `${config.location} ${descriptor} offers a well-kept rental with practical amenities and convenient access to daily essentials.`,
        monthlyRent,
        bedrooms: (index % 5) + 1,
        bathrooms: (index % 3) + 1,
        totalRooms: ((index % 5) + 1) + ((index % 3) + 1) + 1,
        furnished: index % 2 === 0,
        amenities: {
          solar: index % 2 === 0,
          borehole: index % 3 !== 1,
          security: index % 4 !== 0,
          parking: index % 3 !== 2,
          internet: index % 5 < 3,
        },
        imageUrls: [IMAGES[index % IMAGES.length], IMAGES[(index + 1) % IMAGES.length]],
        phoneNumber: '+263771234567',
        type: 'rent',
        offer: false,
        location: config.location,
      };
    })
  );
}

async function ensureListing(listing, token, index, total) {
  try {
    await request('POST', '/api/v1/listings', listing, token);
    process.stdout.write(`\r  Creating listings... ${index}/${total}`);
    return true;
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
      return false;
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
  const landlordTokens = [];

  for (const landlord of landlordSeeds) {
    const result = await ensureUser(landlord);
    if (result.created) createdUsers += 1;
    landlordTokens.push(result.token);
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
  for (let index = 0; index < listings.length; index += 1) {
    const created = await ensureListing(
      listings[index],
      landlordTokens[index],
      index + 1,
      listings.length
    );
    if (created) createdListings += 1;
  }

  console.log(`\n✓ ${createdListings} demo listings created`);
  console.log('\nDemo credentials:');
  console.log('  Landlord:        landlord@demo.com / demo1234');
  console.log('  Extra landlords: landlord2-36@demo.com / demo1234');
  console.log('  Premium tenant:  premium@demo.com / demo1234');
  console.log('  Free tenant:     tenant@demo.com / demo1234');
  console.log(
    '\nNote: premium@demo.com is created as a tenant account only. Premium activation still requires the payment/webhook flow.\n'
  );
}

seed().catch((error) => {
  console.error('\nSeed failed:', error.message);
  process.exit(1);
});
