import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Box, Chip, Grid, Stack } from "@mui/material";
import { FaCalendarDay, FaLocationDot, FaUserGroup } from "react-icons/fa6";
import { Heading, SubHeading } from "../../components/Heading";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import DotLoader from "../../components/Spinner/dotLoader";
import useTypedSelector from "../../hooks/useTypedSelector";
import {
  useCreateBookingMutation,
  useGetProviderProfileQuery,
  useGetRoomAvailabilityQuery,
  useGetStayByIdQuery,
} from "../../redux/api/stayApiSlice";
import { thousandSeparatorNumber } from "../../utils";

const CANCELLATION_POLICY_MAP: Record<string, string> = {
  flexible: "Free cancellation up to 24h before check-in",
  moderate: "50% refund if cancelled 5+ days before",
  strict: "Non-refundable within 7 days",
  non_refundable: "No refund",
};

const getRoomName = (room: any) =>
  room?.name || room?.title || room?.roomType || room?.type || "Temporary stay";

const getRoomLocation = (room: any) =>
  room?.location || room?.address || room?.city || room?.province || "Location unavailable";

const getRoomDescription = (room: any) =>
  room?.description || room?.summary || room?.details || "No description available yet.";

const getRoomImages = (room: any) => {
  if (Array.isArray(room?.images) && room.images.length > 0) return room.images;
  if (typeof room?.image === "string") return [room.image];
  if (typeof room?.coverImage === "string") return [room.coverImage];
  return [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  ];
};

const getRoomPrice = (room: any) =>
  Number(
    room?.resolvedPrice ||
      room?.basePricePerNight ||
      room?.pricePerNight ||
      room?.nightlyRate ||
      room?.price ||
      0
  );

const getRoomCapacity = (room: any) =>
  Number(room?.maxGuests || room?.capacity || room?.guests || room?.occupancy || 1);

const getAmenities = (room: any) => {
  if (Array.isArray(room?.amenities)) {
    return room.amenities.filter(Boolean);
  }

  if (room?.amenities && typeof room.amenities === "object") {
    return Object.entries(room.amenities)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);
  }

  return [];
};

const getDayCount = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();

  if (!checkIn || !checkOut || Number.isNaN(diff) || diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatAmenity = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toIsoDate = (value: string | Date) => new Date(value).toISOString().slice(0, 10);

const expandDateRange = (start: string | Date, end: string | Date) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dates = new Set<string>();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return dates;
  }

  const cursor = new Date(startDate);
  while (cursor < endDate) {
    dates.add(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const getProviderProfile = (data: any) =>
  data?.provider || data?.data?.provider || data?.providerProfile || data?.data?.providerProfile || null;

const getProviderLocation = (provider: any) =>
  provider?.location?.city || provider?.city || provider?.location || "Location unavailable";

const getProviderInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TS";

const RoomDetail = () => {
  const navigate = useNavigate();
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const authUser = useTypedSelector((state) => state.auth?.user);
  const [form, setForm] = useState({
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: searchParams.get("guests") || "1",
    specialRequests: "",
  });
  const [toast, setToast] = useState({
    appearence: false,
    type: "success",
    message: "",
  });

  const { data: room, isLoading, error } = useGetStayByIdQuery(roomId, { skip: !roomId });
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const { data: providerData } = useGetProviderProfileQuery(room?.providerId || room?.provider?._id || "", {
    skip: !(room?.providerId || room?.provider?._id),
  });

  const shouldCheckAvailability = Boolean(roomId && form.checkIn && form.checkOut);
  const {
    data: availability,
    isFetching: isCheckingAvailability,
    error: availabilityError,
  } = useGetRoomAvailabilityQuery(
    {
      roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
    },
    { skip: !shouldCheckAvailability }
  );

  const images = useMemo(() => getRoomImages(room), [room]);
  const provider = useMemo(() => getProviderProfile(providerData), [providerData]);
  const nights = getDayCount(form.checkIn, form.checkOut);
  const nightlyRate = getRoomPrice(room);
  const totalPrice = nights * nightlyRate;
  const bookingMode = room?.bookingMode || room?.bookingSettings?.mode || room?.settings?.bookingMode || "request";
  const policyCode = room?.policyCode || room?.cancellationPolicy || room?.provider?.providerProfile?.cancellationPolicy;
  const checkInTime = room?.checkInTime || provider?.checkInTime || "14:00";
  const checkOutTime = room?.checkOutTime || provider?.checkOutTime || "11:00";

  const forbiddenDates = useMemo(() => {
    const ranges = [
      ...(availability?.bookedRanges || availability?.data?.bookedRanges || []),
      ...(availability?.blockedRanges || availability?.data?.blockedRanges || []),
    ];
    const dates = new Set<string>();

    ranges.forEach((range: any) => {
      const start = range?.checkIn || range?.startDate;
      const end = range?.checkOut || range?.endDate;

      if (!start || !end) return;

      expandDateRange(start, end).forEach((value) => dates.add(value));
    });

    return dates;
  }, [availability]);

  const isAvailable = useMemo(() => {
    if (typeof availability?.isAvailable === "boolean") return availability.isAvailable;
    if (typeof availability?.data?.isAvailable === "boolean") return availability.data.isAvailable;
    if (!shouldCheckAvailability) return null;
    return forbiddenDates.size === 0;
  }, [availability, forbiddenDates, shouldCheckAvailability]);

  const showToast = (type: string, message: string) => {
    setToast({
      appearence: true,
      type,
      message,
    });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, appearence: false }));
  };

  useEffect(() => {
    if (!shouldCheckAvailability) return;

    if (availabilityError) {
      showToast(
        "warning",
        (availabilityError as any)?.data?.message ||
          "Availability could not be checked for the selected dates."
      );
      return;
    }

    if (isCheckingAvailability) return;

    if (isAvailable === true) {
      showToast("success", "Room is available for these dates.");
    } else if (isAvailable === false) {
      showToast("error", "Room is not available for these dates.");
    }
  }, [availabilityError, isAvailable, isCheckingAvailability, shouldCheckAvailability]);

  const validateSelectedDate = (field: "checkIn" | "checkOut", nextValue: string) => {
    if (!nextValue) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDate = new Date(nextValue);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate < today) {
      showToast("error", "Past dates cannot be selected.");
      return false;
    }

    const nextForm = { ...form, [field]: nextValue };
    if (nextForm.checkIn && nextForm.checkOut) {
      const start = new Date(nextForm.checkIn);
      const end = new Date(nextForm.checkOut);

      if (start >= end) {
        showToast("error", "Check-out must be after check-in.");
        return false;
      }

      const selectedDates = expandDateRange(nextForm.checkIn, nextForm.checkOut);
      const overlapsForbidden = Array.from(selectedDates).some((date) => forbiddenDates.has(date));

      if (overlapsForbidden) {
        showToast("error", "Selected dates overlap booked or blocked dates.");
        return false;
      }
    }

    return true;
  };

  const handleDateChange = (field: "checkIn" | "checkOut", value: string) => {
    if (value && forbiddenDates.has(value)) {
      setForm((prev) => ({ ...prev, [field]: "" }));
      showToast("warning", "That date is unavailable. Please choose another date.");
      return;
    }

    if (!validateSelectedDate(field, value)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authUser) {
      navigate("/login");
      return;
    }

    if (!form.checkIn || !form.checkOut) {
      showToast("error", "Select check-in and check-out dates before booking.");
      return;
    }

    if (nights <= 0) {
      showToast("error", "Check-out must be after check-in.");
      return;
    }

    if (isAvailable === false) {
      showToast("error", "This room is unavailable for the selected dates.");
      return;
    }

    try {
      const booking = await createBooking({
        room: roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests || 1),
        specialRequests: form.specialRequests,
        totalPrice,
      }).unwrap();

      const bookingStatus =
        booking?.status || booking?.data?.booking?.status || booking?.booking?.status || "";
      const successMessage =
        bookingStatus === "confirmed"
          ? "Booking confirmed!"
          : "Booking request sent — awaiting provider confirmation";

      showToast("success", successMessage);
      window.setTimeout(() => navigate("/stays/bookings"), 900);
    } catch (bookingError: any) {
      showToast(
        "error",
        bookingError?.data?.message || "Booking could not be completed right now."
      );
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <DotLoader />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <AppContainer sx={{ py: 6 }}>
        <AppCard sx={{ p: 3, borderRadius: 3 }}>
          <Heading sx={{ fontSize: "22px", mb: 1 }}>Room unavailable</Heading>
          <SubHeading>
            {(error as any)?.data?.message || "Room details could not be loaded."}
          </SubHeading>
        </AppCard>
      </AppContainer>
    );
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, background: "#f8fafc", minHeight: "calc(100vh - 72px)" }}>
      <AppContainer>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={2.5}>
              <AppCard sx={{ overflow: "hidden", borderRadius: 3 }}>
                <Box
                  component="img"
                  src={images[0]}
                  alt={getRoomName(room)}
                  sx={{ width: "100%", height: { xs: 260, md: 420 }, objectFit: "cover" }}
                />
              </AppCard>

              <Grid container spacing={2}>
                {images.slice(1, 4).map((image: string) => (
                  <Grid item xs={12} sm={4} key={image}>
                    <AppCard sx={{ overflow: "hidden", borderRadius: 3 }}>
                      <Box
                        component="img"
                        src={image}
                        alt={getRoomName(room)}
                        sx={{ width: "100%", height: 150, objectFit: "cover" }}
                      />
                    </AppCard>
                  </Grid>
                ))}
              </Grid>

              <AppCard sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
                <Stack spacing={2.5}>
                  <AppCard
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      boxShadow: "none",
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: "#0f766e", width: 52, height: 52 }}>
                        {getProviderInitials(
                          provider?.businessName || room?.provider?.providerProfile?.businessName || ""
                        )}
                      </Avatar>
                      <Box>
                        <Heading sx={{ fontSize: "20px", mb: 0.5 }}>
                          {provider?.businessName ||
                            room?.provider?.providerProfile?.businessName ||
                            "Verified provider"}
                        </Heading>
                        <SubHeading sx={{ color: "#475569" }}>
                          {(provider?.businessType ||
                            room?.provider?.providerProfile?.businessType ||
                            "Stay provider") +
                            " · " +
                            getProviderLocation(provider || room?.provider?.providerProfile)}
                        </SubHeading>
                      </Box>
                      {(provider?.verificationStatus ||
                        room?.provider?.providerProfile?.verificationStatus) === "approved" ? (
                        <Chip label="✓ Verified" color="success" sx={{ ml: "auto" }} />
                      ) : null}
                    </Stack>
                  </AppCard>

                  <Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Box>
                        <Heading sx={{ mb: 1 }}>{getRoomName(room)}</Heading>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}>
                          <FaLocationDot />
                          <SubHeading>{getRoomLocation(room)}</SubHeading>
                        </Box>
                      </Box>
                      <Chip
                        label={
                          bookingMode === "instant" ? "⚡ Instant Booking" : "📋 Request to Book"
                        }
                        sx={{
                          background: bookingMode === "instant" ? "#DBEAFE" : "#FEF3C7",
                          color: bookingMode === "instant" ? "#1D4ED8" : "#B45309",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Chip icon={<FaUserGroup />} label={`Up to ${getRoomCapacity(room)} guests`} />
                    <Chip
                      icon={<FaCalendarDay />}
                      label={`$${thousandSeparatorNumber(nightlyRate)}/night`}
                    />
                  </Stack>

                  <SubHeading sx={{ color: "#334155", lineHeight: 1.8 }}>
                    {getRoomDescription(room)}
                  </SubHeading>

                  <Box>
                    <Heading sx={{ fontSize: "22px", mb: 1.5 }}>Amenities</Heading>
                    {getAmenities(room).length > 0 ? (
                      <Grid container spacing={1.5}>
                        {getAmenities(room).map((amenity: string) => (
                          <Grid item xs={12} sm={6} md={4} key={amenity}>
                            <SubHeading sx={{ color: "#334155" }}>
                              ✓ {formatAmenity(amenity)}
                            </SubHeading>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <SubHeading>No amenities listed yet.</SubHeading>
                    )}
                  </Box>

                  <Box>
                    <Heading sx={{ fontSize: "22px", mb: 1.5 }}>Policies</Heading>
                    <Stack spacing={1}>
                      <SubHeading sx={{ color: "#334155" }}>
                        Check-in: {checkInTime} / Check-out: {checkOutTime}
                      </SubHeading>
                      <SubHeading sx={{ color: "#334155" }}>
                        {room?.cancellationPolicyCustomText ||
                          CANCELLATION_POLICY_MAP[policyCode] ||
                          "Cancellation policy will be shared by the provider before confirmation."}
                      </SubHeading>
                    </Stack>
                  </Box>
                </Stack>
              </AppCard>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4}>
            <AppCard
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                position: { lg: "sticky" },
                top: 80,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Heading sx={{ fontSize: "24px" }}>Book this stay</Heading>
                  <SubHeading>Select dates, check availability, then confirm your booking.</SubHeading>
                </Box>

                <Chip
                  label={bookingMode === "instant" ? "⚡ Instant Booking" : "📋 Request to Book"}
                  sx={{
                    alignSelf: "flex-start",
                    background: bookingMode === "instant" ? "#DBEAFE" : "#FEF3C7",
                    color: bookingMode === "instant" ? "#1D4ED8" : "#B45309",
                    fontWeight: 700,
                  }}
                />

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <AppInput
                      label="Check-in"
                      type="date"
                      value={form.checkIn}
                      onChange={(event) => handleDateChange("checkIn", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                    />
                    <AppInput
                      label="Check-out"
                      type="date"
                      value={form.checkOut}
                      onChange={(event) => handleDateChange("checkOut", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: form.checkIn || new Date().toISOString().slice(0, 10),
                      }}
                    />
                    <AppInput
                      label="Guests"
                      type="number"
                      value={form.guests}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          guests: String(
                            Math.min(
                              getRoomCapacity(room),
                              Math.max(1, Number(event.target.value || 1))
                            )
                          ),
                        }))
                      }
                      inputProps={{ min: 1, max: getRoomCapacity(room) }}
                    />
                    <AppInput
                      label="Special requests"
                      multiline
                      minRows={3}
                      value={form.specialRequests}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, specialRequests: event.target.value }))
                      }
                      placeholder="Arrival time, extra needs, notes..."
                    />

                    <Box sx={{ p: 2, background: "#f8fafc", borderRadius: 2 }}>
                      <SubHeading sx={{ mb: 0.5 }}>Pricing summary</SubHeading>
                      <Box sx={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                        <span>
                          ${thousandSeparatorNumber(nightlyRate)} x {nights || 0} night
                          {nights === 1 ? "" : "s"}
                        </span>
                        <strong>${thousandSeparatorNumber(totalPrice || 0)}</strong>
                      </Box>
                    </Box>

                    <AppButton type="submit" disabled={isBooking || isCheckingAvailability}>
                      {authUser ? (isBooking ? "Booking..." : "Book now") : "Log in to book"}
                    </AppButton>
                  </Stack>
                </Box>
              </Stack>
            </AppCard>
          </Grid>
        </Grid>
      </AppContainer>

      <ToastAlert
        appearence={toast.appearence}
        type={toast.type}
        message={toast.message}
        handleClose={handleCloseToast}
      />
    </Box>
  );
};

export default RoomDetail;
