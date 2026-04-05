'use strict';

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const API_BASE = (
  process.env.SEED_API_BASE ||
  process.env.API_BASE ||
  `http://127.0.0.1:${process.env.PORT || 5000}`
).replace(/\/+$/, '');
const SEED_API_KEY = process.env.SEED_API_KEY || 'debug123';
const TARGET_LISTING_COUNT = 100;
const DEMO_PHONE = '+263771234567';
const ADMIN_SEED = {
  username: 'demo_admin',
  email: 'admin@demo.com',
  password: 'demo1234',
};
const FALLBACK_ADMIN_SEED = {
  email: 'admin@demo.com',
};

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
    province: 'Harare',
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
    province: 'Harare',
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
    province: 'Harare',
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
    province: 'Harare',
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
    province: 'Harare',
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
    province: 'Harare',
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
  {
    location: 'Suburbs',
    province: 'Bulawayo',
    rentMin: 450,
    rentMax: 1200,
    descriptors: [
      'City Villa',
      'Executive Flat',
      'Secure Townhouse',
      'Classic Residence',
      'Urban Home',
      'Garden Apartment',
    ],
  },
  {
    location: 'Murambi',
    province: 'Manicaland',
    rentMin: 300,
    rentMax: 850,
    descriptors: [
      'Hillside Cottage',
      'Modern Duplex',
      'Family Flat',
      'Sunny Residence',
      'Comfort Home',
      'Quiet Retreat',
    ],
  },
  {
    location: 'Daylesford',
    province: 'Midlands',
    rentMin: 250,
    rentMax: 700,
    descriptors: [
      'Neighbourhood House',
      'Modern Cottage',
      'Starter Duplex',
      'Practical Family Home',
      'Secure Residence',
      'Bright Apartment',
    ],
  },
];

const PROVIDERS = [
  {
    username: 'provider1',
    email: 'provider1@demo.com',
    password: 'demo1234',
    providerProfile: {
      businessName: 'Borrowdale Boutique Hotel',
      businessType: 'hotel',
      contactPhone: DEMO_PHONE,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      description: 'Boutique hotel for polished short stays in Borrowdale.',
      imageUrls: [IMAGES[0], IMAGES[1]],
      location: {
        province: 'Harare',
        city: 'Borrowdale',
      },
      amenities: {
        wifi: true,
        parking: true,
        breakfast: true,
      },
      cancellationPolicy: 'flexible',
    },
  },
  {
    username: 'provider2',
    email: 'provider2@demo.com',
    password: 'demo1234',
    providerProfile: {
      businessName: 'Highlands Lodge',
      businessType: 'lodge',
      contactPhone: DEMO_PHONE,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      description: 'Comfortable lodge with easy access to Highlands amenities.',
      imageUrls: [IMAGES[2], IMAGES[3]],
      location: {
        province: 'Harare',
        city: 'Highlands',
      },
      amenities: {
        wifi: true,
        parking: true,
        breakfast: true,
      },
      cancellationPolicy: 'moderate',
    },
  },
  {
    username: 'provider3',
    email: 'provider3@demo.com',
    password: 'demo1234',
    providerProfile: {
      businessName: 'Avondale B&B',
      businessType: 'bnb',
      contactPhone: DEMO_PHONE,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      description: 'Small B&B for simple overnight stays in Avondale.',
      imageUrls: [IMAGES[4]],
      location: {
        province: 'Harare',
        city: 'Avondale',
      },
      amenities: {
        wifi: true,
        parking: false,
        breakfast: true,
      },
      cancellationPolicy: 'flexible',
    },
  },
  {
    username: 'provider4',
    email: 'provider4@demo.com',
    password: 'demo1234',
    providerProfile: {
      businessName: 'Bulawayo Guesthouse',
      businessType: 'guesthouse',
      contactPhone: DEMO_PHONE,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      description: 'Guesthouse suited to practical family and business visits.',
      imageUrls: [IMAGES[5], IMAGES[6]],
      location: {
        province: 'Bulawayo',
        city: 'Suburbs',
      },
      amenities: {
        wifi: true,
        parking: true,
        breakfast: false,
      },
      cancellationPolicy: 'flexible',
    },
  },
  {
    username: 'provider5',
    email: 'provider5@demo.com',
    password: 'demo1234',
    providerProfile: {
      businessName: 'Mutare Inn',
      businessType: 'inn',
      contactPhone: DEMO_PHONE,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      description: 'Inn offering dependable short-stay rooms in Mutare.',
      imageUrls: [IMAGES[6], IMAGES[7]],
      location: {
        province: 'Manicaland',
        city: 'Murambi',
      },
      amenities: {
        wifi: true,
        parking: true,
        breakfast: false,
      },
      cancellationPolicy: 'strict',
    },
  },
];

const ROOM_MATRIX = [
  [
    {
      name: 'Standard Room',
      description: 'Standard hotel room for everyday short stays.',
      roomType: 'standard',
      basePricePerNight: 80,
      capacity: 2,
      amenities: { wifi: true, aircon: true, tv: true, ensuite: true },
      imageUrls: [IMAGES[0]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'flexible',
    },
    {
      name: 'Deluxe Room',
      description: 'Larger deluxe room with upgraded comfort.',
      roomType: 'deluxe',
      basePricePerNight: 150,
      pricingRules: [{ type: 'weekend', pricePerNight: 180 }],
      capacity: 2,
      amenities: { wifi: true, aircon: true, tv: true, ensuite: true, balcony: true },
      imageUrls: [IMAGES[0], IMAGES[1]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'flexible',
    },
    {
      name: 'Suite',
      description: 'Suite for premium short-stay bookings.',
      roomType: 'suite',
      basePricePerNight: 250,
      capacity: 4,
      amenities: { wifi: true, aircon: true, tv: true, ensuite: true, minibar: true },
      imageUrls: [IMAGES[1]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'moderate',
    },
  ],
  [
    {
      name: 'Standard Room',
      description: 'Lodge standard room for dependable overnight stays.',
      roomType: 'standard',
      basePricePerNight: 60,
      capacity: 2,
      amenities: { wifi: true, tv: true, ensuite: true },
      imageUrls: [IMAGES[2]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'moderate',
    },
    {
      name: 'Family Room',
      description: 'Family room with space for small groups.',
      roomType: 'family',
      basePricePerNight: 90,
      capacity: 4,
      amenities: { wifi: true, tv: true, balcony: true },
      imageUrls: [IMAGES[2], IMAGES[3]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'moderate',
    },
  ],
  [
    {
      name: 'Single Room',
      description: 'Simple B&B single room.',
      roomType: 'single',
      basePricePerNight: 35,
      capacity: 1,
      amenities: { wifi: true, ensuite: true },
      imageUrls: [IMAGES[4]],
      status: 'available',
      bookingMode: 'request',
      cancellationPolicy: 'flexible',
    },
    {
      name: 'Twin Room',
      description: 'Twin room suited to two guests.',
      roomType: 'twin',
      basePricePerNight: 50,
      capacity: 2,
      amenities: { wifi: true, tv: true, ensuite: true },
      imageUrls: [IMAGES[4], IMAGES[5]],
      status: 'available',
      bookingMode: 'request',
      cancellationPolicy: 'flexible',
    },
  ],
  [
    {
      name: 'Standard Room',
      description: 'Guesthouse standard room.',
      roomType: 'standard',
      basePricePerNight: 45,
      capacity: 2,
      amenities: { wifi: true, tv: true },
      imageUrls: [IMAGES[5]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'flexible',
    },
    {
      name: 'Single Room',
      description: 'Compact single room for one guest.',
      roomType: 'single',
      basePricePerNight: 30,
      capacity: 1,
      amenities: { wifi: true },
      imageUrls: [IMAGES[6]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'strict',
    },
    {
      name: 'Family Room',
      description: 'Family room for flexible group stays.',
      roomType: 'family',
      basePricePerNight: 70,
      capacity: 4,
      amenities: { wifi: true, tv: true, balcony: true },
      imageUrls: [IMAGES[5], IMAGES[6]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'moderate',
    },
  ],
  [
    {
      name: 'Standard Room',
      description: 'Dependable inn standard room.',
      roomType: 'standard',
      basePricePerNight: 40,
      capacity: 2,
      amenities: { wifi: true, tv: true, aircon: true },
      imageUrls: [IMAGES[6]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'strict',
    },
    {
      name: 'Deluxe Room',
      description: 'Deluxe inn room with extra comfort.',
      roomType: 'deluxe',
      basePricePerNight: 65,
      capacity: 3,
      amenities: { wifi: true, tv: true, aircon: true, ensuite: true },
      imageUrls: [IMAGES[6], IMAGES[7]],
      status: 'available',
      bookingMode: 'instant',
      cancellationPolicy: 'strict',
    },
  ],
];

const PROVIDER_BOOKING_COUNTS = [2, 2, 1, 1, 1];

function getIsoDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

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
    phoneNumber: DEMO_PHONE,
    nationalId: `DEMO${String(index + 1).padStart(8, '0')}`,
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

async function ensureAdmin() {
  try {
    const login = await request('POST', '/api/v1/users/login', {
      email: ADMIN_SEED.email,
      password: ADMIN_SEED.password,
    });
    return login.token;
  } catch (error) {
    if ([401, 403, 404].includes(error.status)) {
      throw new Error(
        `Unable to log in as admin via API. Seed requires an existing verified admin account for ${FALLBACK_ADMIN_SEED.email}.`
      );
    }
    throw error;
  }
}

async function resolveProviderId(providerData, providerToken, adminToken) {
  const myProfile = await request('GET', '/api/v1/providers/me', null, providerToken).catch(
    () => null
  );
  const myProviderId = myProfile?.data?.provider?._id;
  if (myProviderId) {
    return myProviderId;
  }

  const providerList = await request('GET', '/api/v1/providers', null, adminToken).catch(
    () => null
  );
  const matchedProvider =
    providerList?.data?.find((provider) => provider?.email === providerData.email) || null;

  return matchedProvider?._id || null;
}

async function ensureProvider(providerData, adminToken) {
  let created = false;
  let approved = false;
  let providerId = null;

  try {
    const registerResponse = await request('POST', '/api/v1/providers/register', {
      username: providerData.username,
      email: providerData.email,
      password: providerData.password,
      providerProfile: providerData.providerProfile,
    });
    providerId = registerResponse?.data?.user?._id || null;
    created = true;
  } catch (error) {
    if (![400, 409].includes(error.status)) {
      throw error;
    }
  }

  let login;
  try {
    login = await request('POST', '/api/v1/users/login', {
      email: providerData.email,
      password: providerData.password,
    });
  } catch (error) {
    if (error.status === 403) {
      throw new Error(
        `Provider ${providerData.email} is not email-verified. Set SKIP_EMAIL_VERIFICATION=true on the backend or verify the provider account before seeding rooms and bookings.`
      );
    }
    throw error;
  }
  const user = login?.data?.user || null;
  providerId = providerId || user?._id || null;
  providerId = providerId || (await resolveProviderId(providerData, login.token, adminToken));

  if (!providerId) {
    throw new Error(`Unable to resolve provider id for ${providerData.email}`);
  }

  if (user?.providerProfile?.verificationStatus !== 'approved') {
    await request('PUT', `/api/v1/providers/${providerId}/verify`, { status: 'approved' }, adminToken);
    approved = true;
  }

  return {
    token: login.token,
    providerId,
    created,
    approved,
  };
}

function buildRooms(providerIndex) {
  return ROOM_MATRIX[providerIndex]
    ? ROOM_MATRIX[providerIndex].map((room) => ({ ...room }))
    : [];
}

async function ensureRooms(providerIndex, providerToken) {
  const mineResponse = await request('GET', '/api/v1/rooms/mine', null, providerToken);
  const existingRooms = mineResponse?.data?.rooms || [];
  if (existingRooms.length > 0) {
    return {
      rooms: existingRooms,
      created: 0,
    };
  }

  const rooms = [];
  for (const room of buildRooms(providerIndex)) {
    const response = await request('POST', '/api/v1/rooms', room, providerToken);
    rooms.push(response?.data?.room);
  }

  return {
    rooms,
    created: rooms.length,
  };
}

async function ensureBookings(providerRooms, guestToken, providerTokens) {
  let created = 0;
  let confirmed = 0;
  for (let index = 0; index < providerRooms.length; index += 1) {
    const entry = providerRooms[index];
    const room = entry.rooms[0];
    const bookingCount = PROVIDER_BOOKING_COUNTS[index] || 1;
    if (!room) {
      continue;
    }

    for (let bookingIndex = 0; bookingIndex < bookingCount; bookingIndex += 1) {
      const checkIn = getIsoDate(7 + index * 3 + bookingIndex * 4);
      const checkOut = getIsoDate(9 + index * 3 + bookingIndex * 4);

      try {
        const response = await request(
          'POST',
          '/api/v1/bookings',
          {
            roomId: room._id,
            checkIn,
            checkOut,
            guestCount: 1,
            specialRequests: `Demo booking ${bookingIndex + 1}`,
          },
          guestToken
        );
        created += 1;

        if (index < 2 && bookingIndex === 0) {
          await request(
            'POST',
            `/api/v1/bookings/${response?.data?.booking?._id}/confirm`,
            {},
            providerTokens[index]
          );
          confirmed += 1;
        }
      } catch (error) {
        if (error.status === 409) {
          console.warn(`  Warning: booking already exists for room ${room._id}`);
          continue;
        }
        throw error;
      }
    }
  }

  return { created, confirmed };
}

async function ensureBlockedDates(providerRooms, providerTokens) {
  let created = 0;
  const startDate = getIsoDate(30);
  const endDate = getIsoDate(35);

  for (let index = 0; index < providerRooms.length; index += 1) {
    const entry = providerRooms[index];
    const room = entry.rooms[entry.rooms.length - 1];
    if (!room) {
      continue;
    }

    try {
      await request(
        'POST',
        `/api/v1/rooms/${room._id}/block`,
        {
          startDate,
          endDate,
          reason: 'Maintenance',
        },
        providerTokens[index]
      );
      created += 1;
    } catch (error) {
      if (error.status === 409) {
        console.warn(`  Warning: blocked dates already exist for room ${room._id}`);
        continue;
      }
      throw error;
    }
  }

  return created;
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
      location: {
        addressLine: `${10 + index * 7} ${descriptorLabel} Road, ${config.location}`,
        country: 'Zimbabwe',
        province: config.province,
        city: config.location,
      },
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
    return true;
  }

  try {
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
  } catch (error) {
    console.warn(
      `\n  Payment/webhook finalization failed for listing ${listing._id}; falling back to direct database update.`
    );
  }

  const updatedListing = await getListingById(listing._id, token).catch(() => null);
  if (updatedListing?.paymentDeadline == null && updatedListing?.status === 'active') {
    return true;
  }

  console.warn(
    `\n  Listing ${listing._id} could not be finalized to unlimited lifetime via API-only flow.`
  );
  return false;
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

  const adminToken = await ensureAdmin();
  const providerResults = [];
  let createdProviders = 0;
  let createdRooms = 0;

  for (let index = 0; index < PROVIDERS.length; index += 1) {
    const providerResult = await ensureProvider(PROVIDERS[index], adminToken);
    if (providerResult.created) createdProviders += 1;
    providerResults.push(providerResult);
  }
  const approvedProviders = providerResults.length;

  const allProviderRooms = [];
  for (let index = 0; index < providerResults.length; index += 1) {
    const roomResult = await ensureRooms(index, providerResults[index].token);
    createdRooms += roomResult.created;
    allProviderRooms.push({
      providerId: providerResults[index].providerId,
      rooms: roomResult.rooms,
    });
  }

  const providerTokens = providerResults.map((providerResult) => providerResult.token);
  const bookingCounts = await ensureBookings(
    allProviderRooms,
    premiumTenant.token,
    providerTokens
  );
  const blockedCount = await ensureBlockedDates(allProviderRooms, providerTokens);

  console.log(`✓ ${createdProviders} temporary-stay providers created`);
  console.log(`✓ Approved providers: ${approvedProviders}`);
  console.log(`✓ ${createdRooms} temporary-stay rooms created`);
  console.log(`✓ Bookings created/confirmed: ${bookingCounts.created}/${bookingCounts.confirmed}`);
  console.log(`✓ Blocked ranges: ${blockedCount}`);
  console.log('\nDemo credentials:');
  console.log('  Landlord:        landlord@demo.com / demo1234');
  console.log('  Extra landlords: landlord2-100@demo.com / demo1234');
  console.log('  Premium tenant:  premium@demo.com / demo1234');
  console.log('  Free tenant:     tenant@demo.com / demo1234');
  console.log(`  Admin:           ${ADMIN_SEED.email} / ${ADMIN_SEED.password}`);
  console.log(
    '\nNote: premium@demo.com is created as a tenant account only. Premium activation still requires the payment/webhook flow.'
  );
  console.log('\nDemo credentials (Temporary Stay):');
  PROVIDERS.forEach((provider) => {
    console.log(
      `  ${provider.providerProfile.businessName}: ${provider.email} / ${provider.password}`
    );
  });
  console.log('  Guest (premium tenant):  premium@demo.com / demo1234');
  if (SEED_API_KEY) {
    console.log('Seed rate-limit bypass header enabled via SEED_API_KEY.\n');
  } else {
    console.log(
      'Configure SEED_API_KEY on both the backend and this script environment if you need to bypass API rate limits while seeding large datasets.\n'
    );
  }
}

seed()
  .catch((error) => {
    console.error('\nSeed failed:', error.message);
    process.exitCode = 1;
  });
