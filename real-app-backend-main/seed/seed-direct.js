'use strict';

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const TARGET_LISTING_COUNT = 100;
const DEMO_PHONE = '+263771234567';
const ADMIN_SEED = {
  username: 'demo_admin',
  email: 'admin@demo.com',
  password: 'demo1234',
  role: 'admin',
};

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
      location: { province: 'Harare', city: 'Borrowdale' },
      amenities: { wifi: true, parking: true, breakfast: true },
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
      location: { province: 'Harare', city: 'Highlands' },
      amenities: { wifi: true, parking: true, breakfast: true },
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
      location: { province: 'Harare', city: 'Avondale' },
      amenities: { wifi: true, parking: false, breakfast: true },
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
      location: { province: 'Bulawayo', city: 'Suburbs' },
      amenities: { wifi: true, parking: true, breakfast: false },
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
      location: { province: 'Manicaland', city: 'Murambi' },
      amenities: { wifi: true, parking: true, breakfast: false },
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
const passwordCache = new Map();

function getIsoDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

async function hashPassword(password) {
  if (!passwordCache.has(password)) {
    passwordCache.set(password, await bcrypt.hash(password, 12));
  }

  return passwordCache.get(password);
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
    const rentProgress = localIndex === 0 ? 0 : (localIndex % 10) / 9;
    const monthlyRent = Math.round(
      config.rentMin + (config.rentMax - config.rentMin) * rentProgress
    );
    const bedrooms = (index % 5) + 1;
    const bathrooms = (index % 3) + 1;
    const addressLine = `${10 + index * 7} ${descriptorLabel} Road, ${config.location}`;

    return {
      name: `${config.location} ${descriptorLabel}`,
      address: addressLine,
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
      province: config.province,
      city: config.location,
      addressLine,
    };
  });
}

async function ensureUser(user) {
  const hashedPassword = await hashPassword(user.password);
  const existing = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existing) {
    return {
      created: false,
      user: await prisma.user.update({
        where: { email: user.email },
        data: {
          username: user.username,
          password: hashedPassword,
          role: user.role,
          phoneNumber: user.phoneNumber || null,
          nationalId: user.nationalId || null,
          isEmailVerified: true,
          isPhoneVerified: user.role === 'landlord',
          emailVerificationToken: null,
          emailVerificationExpires: null,
          phoneOtp: null,
          phoneOtpExpires: null,
          premiumExpiry: user.premiumExpiry || null,
          providerProfile: user.providerProfile || null,
        },
      }),
    };
  }

  return {
    created: true,
    user: await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        phoneNumber: user.phoneNumber || null,
        nationalId: user.nationalId || null,
        isEmailVerified: true,
        isPhoneVerified: user.role === 'landlord',
        premiumExpiry: user.premiumExpiry || null,
        providerProfile: user.providerProfile || null,
      },
    }),
  };
}

async function ensureListing(listing, userId) {
  const existing = await prisma.listing.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    await prisma.listing.update({
      where: { id: existing.id },
      data: {
        ...listing,
        status: 'active',
        publishedAt: existing.publishedAt || new Date(),
        paymentDeadline: null,
      },
    });

    return false;
  }

  await prisma.listing.create({
    data: {
      ...listing,
      status: 'active',
      publishedAt: new Date(),
      paymentDeadline: null,
      userId,
    },
  });

  return true;
}

async function ensureRoom(providerId, room) {
  const existing = await prisma.room.findFirst({
    where: { providerId, name: room.name },
  });

  if (existing) {
    return {
      created: false,
      room: await prisma.room.update({
        where: { id: existing.id },
        data: {
          ...room,
          providerId,
        },
      }),
    };
  }

  return {
    created: true,
    room: await prisma.room.create({
      data: {
        ...room,
        providerId,
      },
    }),
  };
}

async function ensureBooking({ roomId, providerId, guestId, checkIn, checkOut, specialRequests, bookingMode }) {
  const existing = await prisma.booking.findFirst({
    where: {
      roomId,
      guestId,
      specialRequests,
    },
  });

  if (existing) {
    return { created: false, booking: existing };
  }

  return {
    created: true,
    booking: await prisma.booking.create({
      data: {
        roomId,
        providerId,
        guestId,
        checkIn,
        checkOut,
        nights: Math.max(1, Math.round((checkOut - checkIn) / 86400000)),
        bookingMode,
        guestCount: 1,
        pricePerNight: 0,
        subtotal: 0,
        commissionRate: 10,
        commissionAmount: 0,
        totalAmount: 0,
        totalPrice: 0,
        netPayout: 0,
        specialRequests,
        status: bookingMode === 'instant' ? 'confirmed' : 'pending_confirmation',
        paymentStatus: 'unpaid',
        settlementStatus: 'pending',
      },
    }),
  };
}

async function ensureBlockedDate(roomId, providerId, startDate, endDate) {
  const existing = await prisma.blockedDate.findFirst({
    where: { roomId, startDate, endDate },
  });

  if (existing) {
    return false;
  }

  await prisma.blockedDate.create({
    data: {
      roomId,
      providerId,
      startDate,
      endDate,
      reason: 'Maintenance',
    },
  });

  return true;
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env to run seed-direct.js');
  }

  console.log('\nSeeding directly with Prisma using DATABASE_URL from .env\n');

  let createdUsers = 0;
  let createdListings = 0;
  let createdProviders = 0;
  let createdRooms = 0;
  let createdBookings = 0;
  let createdBlockedDates = 0;

  const adminResult = await ensureUser({
    ...ADMIN_SEED,
    premiumExpiry: getIsoDate(30),
  });
  if (adminResult.created) createdUsers += 1;

  const landlordSeeds = buildLandlordSeedUsers();
  const listings = buildListings();
  const landlords = [];

  for (const landlord of landlordSeeds) {
    const result = await ensureUser(landlord);
    if (result.created) createdUsers += 1;
    landlords.push(result.user);
  }

  const premiumTenant = await ensureUser({
    username: 'premium_tenant',
    email: 'premium@demo.com',
    password: 'demo1234',
    role: 'tenant',
    premiumExpiry: getIsoDate(30),
  });
  if (premiumTenant.created) createdUsers += 1;

  const freeTenant = await ensureUser({
    username: 'free_tenant',
    email: 'tenant@demo.com',
    password: 'demo1234',
    role: 'tenant',
  });
  if (freeTenant.created) createdUsers += 1;

  for (let index = 0; index < listings.length; index += 1) {
    const created = await ensureListing(listings[index], landlords[index].id);
    if (created) createdListings += 1;
  }

  const providerUsers = [];
  for (const provider of PROVIDERS) {
    const result = await ensureUser({
      username: provider.username,
      email: provider.email,
      password: provider.password,
      role: 'provider',
      phoneNumber: provider.providerProfile.contactPhone || DEMO_PHONE,
      providerProfile: {
        ...provider.providerProfile,
        verificationStatus: 'approved',
        commissionRate: 10,
        verifiedAt: new Date().toISOString(),
      },
    });
    if (result.created) createdProviders += 1;
    providerUsers.push(result.user);
  }

  const providerRooms = [];
  for (let index = 0; index < providerUsers.length; index += 1) {
    const provider = providerUsers[index];
    const definitions = ROOM_MATRIX[index] || [];
    const rooms = [];

    for (const room of definitions) {
      const result = await ensureRoom(provider.id, room);
      rooms.push(result.room);
      if (result.created) {
        createdRooms += 1;
      }
    }

    providerRooms.push({ provider, rooms });
  }

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
      const result = await ensureBooking({
        roomId: room.id,
        providerId: entry.provider.id,
        guestId: premiumTenant.user.id,
        checkIn,
        checkOut,
        bookingMode: room.bookingMode,
        specialRequests: `Demo booking ${bookingIndex + 1}`,
      });

      if (result.created) createdBookings += 1;
    }
  }

  const blockStart = getIsoDate(30);
  const blockEnd = getIsoDate(35);

  for (const entry of providerRooms) {
    const room = entry.rooms[entry.rooms.length - 1];
    if (!room) {
      continue;
    }

    const created = await ensureBlockedDate(room.id, entry.provider.id, blockStart, blockEnd);
    if (created) createdBlockedDates += 1;
  }

  console.log(`✓ ${createdUsers} users created`);
  console.log(`✓ ${createdListings} listings created`);
  console.log(`✓ ${createdProviders} providers created`);
  console.log(`✓ ${createdRooms} rooms created`);
  console.log(`✓ ${createdBookings} bookings created`);
  console.log(`✓ ${createdBlockedDates} blocked date ranges created`);
  console.log('\nDemo credentials:');
  console.log('  Landlord:        landlord@demo.com / demo1234');
  console.log('  Extra landlords: landlord2-100@demo.com / demo1234');
  console.log('  Premium tenant:  premium@demo.com / demo1234');
  console.log('  Free tenant:     tenant@demo.com / demo1234');
  console.log(`  Admin:           ${ADMIN_SEED.email} / ${ADMIN_SEED.password}`);
  console.log('\nTemporary stay providers:');
  for (const provider of PROVIDERS) {
    console.log(`  ${provider.providerProfile.businessName}: ${provider.email} / ${provider.password}`);
  }
  console.log('\nDirect database seed complete.\n');
}

seed()
  .catch((error) => {
    console.error('\nDirect seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
