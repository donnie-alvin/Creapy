import { useState } from "react";
import { Box, Chip, Grid, Stack } from "@mui/material";
import { Heading, SubHeading } from "../../components/Heading";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import DotLoader from "../../components/Spinner/dotLoader";
import {
  useCancelBookingMutation,
  useGetMyBookingsQuery,
} from "../../redux/api/stayApiSlice";
import { formatDate, thousandSeparatorNumber } from "../../utils";

const getBookingRoom = (booking: any) => booking?.room || booking?.stay || booking?.roomDetails || {};

const getRoomName = (booking: any) => {
  const room = getBookingRoom(booking);
  return room?.name || room?.title || room?.roomType || booking?.roomName || "Temporary stay";
};

const getRoomLocation = (booking: any) => {
  const room = getBookingRoom(booking);
  return room?.location || room?.address || room?.city || booking?.location || "Location unavailable";
};

const getRoomImage = (booking: any) => {
  const room = getBookingRoom(booking);
  if (Array.isArray(room?.images) && room.images.length > 0) return room.images[0];
  if (typeof room?.image === "string") return room.image;
  if (typeof room?.coverImage === "string") return room.coverImage;
  return "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80";
};

const getBookingTotal = (booking: any) =>
  Number(booking?.totalPrice || booking?.amount || booking?.price || booking?.total || 0);

const getStatusChip = (status?: string) => {
  switch (status) {
    case "confirmed":
      return <Chip color="success" label="Confirmed" size="small" />;
    case "pending_confirmation":
      return <Chip color="warning" label="Pending" size="small" />;
    case "cancelled":
      return <Chip color="error" label="Cancelled" size="small" />;
    case "completed":
      return <Chip color="default" label="Completed" size="small" />;
    default:
      return <Chip color="default" label={status || "Pending"} size="small" />;
  }
};

const MyBookings = () => {
  const { data: bookings = [], isLoading, error, refetch, isFetching } = useGetMyBookingsQuery();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [toast, setToast] = useState({
    appearence: false,
    type: "success",
    message: "",
  });

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, appearence: false }));
  };

  const showToast = (type: string, message: string) => {
    setToast({
      appearence: true,
      type,
      message,
    });
  };

  const handleCancel = async (booking: any) => {
    const reason = window.prompt("Cancellation reason?");
    if (!reason) return;

    try {
      await cancelBooking({
        id: booking._id,
        body: { reason },
      }).unwrap();
      showToast("success", "Booking cancelled successfully.");
      refetch();
    } catch (cancelError: any) {
      showToast(
        "error",
        cancelError?.data?.message || "Booking could not be cancelled right now."
      );
    }
  };

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, background: "#f8fafc", minHeight: "calc(100vh - 72px)" }}>
      <AppContainer>
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Heading sx={{ mb: 1 }}>My Stay Bookings</Heading>
              <SubHeading>Review your upcoming and previous temporary stay reservations.</SubHeading>
            </Box>
            <AppButton onClick={refetch} disabled={isFetching || isCancelling}>
              Refresh
            </AppButton>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <DotLoader />
            </Box>
          ) : null}

          {error ? (
            <AppCard sx={{ p: 3, borderRadius: 3 }}>
              <SubHeading>
                {(error as any)?.data?.message || "Booking history could not be loaded."}
              </SubHeading>
            </AppCard>
          ) : null}

          {!isLoading && !error && bookings.length === 0 ? (
            <AppCard sx={{ p: 3, borderRadius: 3 }}>
              <SubHeading>You do not have any temporary stay bookings yet.</SubHeading>
            </AppCard>
          ) : null}

          <Grid container spacing={2.5}>
            {bookings.map((booking: any) => {
              const canCancel =
                (booking?.status === "confirmed" || booking?.status === "pending_confirmation") &&
                new Date(booking?.checkIn) > new Date();

              return (
                <Grid item xs={12} md={6} key={booking?._id || `${booking?.room}-${booking?.checkIn}`}>
                  <AppCard sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
                    <Box
                      component="img"
                      src={getRoomImage(booking)}
                      alt={getRoomName(booking)}
                      sx={{ width: "100%", height: 220, objectFit: "cover" }}
                    />
                    <Stack spacing={1.25} sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1.5,
                          alignItems: "flex-start",
                        }}
                      >
                        <Heading sx={{ fontSize: "22px" }}>{getRoomName(booking)}</Heading>
                        {getStatusChip(booking?.status)}
                      </Box>
                      <SubHeading>{getRoomLocation(booking)}</SubHeading>
                      <SubHeading>
                        Check-in: {booking?.checkIn ? formatDate(booking.checkIn) : "Not set"}
                      </SubHeading>
                      <SubHeading>
                        Check-out: {booking?.checkOut ? formatDate(booking.checkOut) : "Not set"}
                      </SubHeading>
                      <SubHeading>Guests: {booking?.guests || booking?.guestCount || 1}</SubHeading>
                      <Box sx={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", pt: 0.5 }}>
                        ${thousandSeparatorNumber(getBookingTotal(booking))}
                      </Box>
                      {canCancel ? (
                        <Box sx={{ pt: 1 }}>
                          <AppButton
                            color="error"
                            onClick={() => handleCancel(booking)}
                            disabled={isCancelling}
                          >
                            Cancel Booking
                          </AppButton>
                        </Box>
                      ) : null}
                    </Stack>
                  </AppCard>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
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

export default MyBookings;
