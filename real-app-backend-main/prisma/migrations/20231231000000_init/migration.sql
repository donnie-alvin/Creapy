-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5jifLXKb2qo_5aXh54USNlvxI34oPpG3zTw&usqp=CAU',
    "role" TEXT NOT NULL DEFAULT 'tenant',
    "phoneNumber" TEXT,
    "nationalId" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneOtp" TEXT,
    "phoneOtpExpires" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "premiumExpiry" TIMESTAMP(3),
    "providerProfile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "province" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "addressLine" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "amenities" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "earlyAccessUntil" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "paymentDeadline" TIMESTAMP(3),
    "bathrooms" INTEGER NOT NULL,
    "bedrooms" INTEGER,
    "totalRooms" INTEGER NOT NULL,
    "furnished" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rent',
    "offer" BOOLEAN NOT NULL,
    "studentAccommodation" BOOLEAN NOT NULL DEFAULT false,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roomType" TEXT,
    "capacity" INTEGER,
    "basePricePerNight" DOUBLE PRECISION NOT NULL,
    "pricingRules" JSONB NOT NULL DEFAULT '[]',
    "amenities" JSONB NOT NULL DEFAULT '{}',
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'available',
    "bookingMode" TEXT NOT NULL DEFAULT 'instant',
    "maxAdvanceBookingDays" INTEGER NOT NULL DEFAULT 90,
    "cancellationPolicy" TEXT,
    "cancellationPolicyCustomText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "providerId" TEXT,
    "guestId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER,
    "pricePerNight" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,
    "commissionRate" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "netPayout" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "bookingMode" TEXT,
    "guestCount" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentRef" TEXT,
    "settlementStatus" TEXT NOT NULL DEFAULT 'pending',
    "specialRequests" TEXT NOT NULL DEFAULT '',
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "cancellationPolicy" TEXT,
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "settlementReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL,
    "listingId" TEXT,
    "bookingId" TEXT,
    "transactionRef" TEXT,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Saved Search',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "notifyBy" TEXT NOT NULL DEFAULT 'email',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "providerId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Listing_userId_status_idx" ON "Listing"("userId", "status");

-- CreateIndex
CREATE INDEX "Room_providerId_status_idx" ON "Room"("providerId", "status");

-- CreateIndex
CREATE INDEX "Booking_roomId_checkIn_checkOut_status_idx" ON "Booking"("roomId", "checkIn", "checkOut", "status");

-- CreateIndex
CREATE INDEX "Booking_guestId_createdAt_idx" ON "Booking"("guestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_isActive_idx" ON "SavedSearch"("isActive");

-- CreateIndex
CREATE INDEX "BlockedDate_roomId_startDate_endDate_idx" ON "BlockedDate"("roomId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
