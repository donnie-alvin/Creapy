const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
};

const getProviderBusinessName = (provider) =>
  provider?.businessName ||
  provider?.providerProfile?.businessName ||
  "Your stay provider";

const getRoomName = (room) =>
  room?.name || room?.title || room?.roomName || room?.listingName || "Booked stay";

const getGuestName = (guest) => guest?.username || guest?.name || "Guest";

const buildBaseText = ({ booking, room, guest, provider, nextActionHint, refundAmount }) => {
  const lines = [
    `Provider: ${getProviderBusinessName(provider)}`,
    `Room: ${getRoomName(room)}`,
    `Guest: ${getGuestName(guest)}`,
    `Check-in: ${formatDate(booking?.checkIn)}`,
    `Check-out: ${formatDate(booking?.checkOut)}`,
    `Booking reference: ${booking?._id || "N/A"}`,
    `Current status: ${booking?.status || "N/A"}`,
    `Next action: ${nextActionHint}`,
  ];

  if (refundAmount !== undefined && refundAmount !== null) {
    lines.push(`Refund amount: ${formatMoney(refundAmount)}`);
  }

  return lines.join("\n");
};

exports.bookingRequestSubmittedProvider = ({ booking, room, guest, provider }) => ({
  to: provider?.email,
  subject: `New booking request for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Review the request and confirm or decline it from your dashboard.",
  }),
});

exports.bookingConfirmedInstantGuest = ({ booking, room, guest, provider }) => ({
  to: guest?.email,
  subject: `Booking confirmed for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Your stay is confirmed. Keep your booking details handy for check-in.",
  }),
});

exports.bookingConfirmedInstantProvider = ({ booking, room, guest, provider }) => ({
  to: provider?.email,
  subject: `Instant booking confirmed for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Prepare for the guest and review the confirmed stay details.",
  }),
});

exports.bookingRequestAcceptedGuest = ({ booking, room, guest, provider }) => ({
  to: guest?.email,
  subject: `Your booking request was accepted for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Proceed with payment or check your booking details for the next step.",
  }),
});

exports.bookingRequestDeclinedGuest = ({ booking, room, guest, provider }) => ({
  to: guest?.email,
  subject: `Your booking request was declined for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Review alternative stays or submit a new booking request.",
    refundAmount: booking?.refundAmount,
  }),
});

exports.bookingCancelledByGuestProvider = ({ booking, room, guest, provider }) => ({
  to: provider?.email,
  subject: `Guest cancelled booking for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Update room availability and review any refund handling if required.",
    refundAmount: booking?.refundAmount,
  }),
});

exports.bookingCancelledByProviderGuest = ({ booking, room, guest, provider }) => ({
  to: guest?.email,
  subject: `Your booking was cancelled for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Check your refund status and book another stay if needed.",
    refundAmount: booking?.refundAmount,
  }),
});

exports.bookingPaymentSuccessGuest = ({ booking, room, guest, provider }) => ({
  to: guest?.email,
  subject: `Payment received for ${getRoomName(room)}`,
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Keep your booking reference handy and get ready for check-in.",
  }),
});

exports.bookingPaymentSuccessProvider = ({ booking, room, guest, provider }) => ({
  to: provider?.email,
  subject: `Payment received for booking ${booking?._id || ""}`.trim(),
  text: buildBaseText({
    booking,
    room,
    guest,
    provider,
    nextActionHint: "Prepare for the stay and track settlement timing in your dashboard.",
  }),
});

exports.bookingSettledProvider = ({ booking, room, guest, provider }) => {
  const subtotal = Number(booking?.totalPrice || 0);
  const commissionRate = Number(booking?.commissionRate || 0);
  const commissionAmount = Number(booking?.commissionAmount || 0);
  const netPayout = subtotal - commissionAmount;

  return {
    to: provider?.email,
    subject: `Settlement completed for booking ${booking?._id || ""}`.trim(),
    text: [
      buildBaseText({
        booking,
        room,
        guest,
        provider,
        nextActionHint: "Reconcile this payout with your booking and settlement records.",
      }),
      `Subtotal: ${formatMoney(subtotal)}`,
      `Commission rate: ${formatMoney(commissionRate)}%`,
      `Commission amount: ${formatMoney(commissionAmount)}`,
      `Net payout: ${formatMoney(netPayout)}`,
    ].join("\n"),
  };
};
