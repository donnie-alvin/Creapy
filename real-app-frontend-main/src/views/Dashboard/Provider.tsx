import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import { Heading, SubHeading } from "../../components/Heading";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import useTypedSelector from "../../hooks/useTypedSelector";
import {
  selectedUserEmail,
  selectedUserName,
} from "../../redux/auth/authSlice";
import {
  toEntityArray,
  toEntityObject,
  useBlockRoomDatesMutation,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useCreateRoomMutation,
  useDeclineBookingMutation,
  useDeleteRoomMutation,
  useGetMyRoomsQuery,
  useGetProviderBookingsQuery,
  useGetProviderProfileQuery,
  useGetProviderSettlementsSummaryQuery,
  useGetRoomAvailabilityQuery,
  useUpdateProviderProfileMutation,
  useUpdateRoomMutation,
} from "../../redux/api/providerApiSlice";
import { convertToFormattedDate, formatDate } from "../../utils";

const tabs = [
  { value: "rooms", label: "Rooms" },
  { value: "bookings", label: "Bookings" },
  { value: "availability", label: "Availability" },
  { value: "profile", label: "Profile" },
  { value: "settlements", label: "Settlements" },
];

const emptyRoomForm = {
  id: "",
  name: "",
  title: "",
  description: "",
  location: "",
  price: "",
  capacity: "",
  status: "",
  image: "",
  extraDetails: "",
};

const emptyBlockForm = {
  roomId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

const emptyProfileForm = {
  businessName: "",
  displayName: "",
  phone: "",
  bio: "",
  location: "",
  payoutDetails: "",
  policies: "",
  extraProfile: "",
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.data?.message || error?.error || fallback;

const getStatusColor = (status?: string) => {
  const value = String(status || "").toLowerCase();

  if (["confirmed", "active", "approved", "success", "settled"].includes(value)) {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (["pending", "awaiting", "processing"].includes(value)) {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (["declined", "cancelled", "canceled", "failed", "rejected"].includes(value)) {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#e2e8f0", color: "#475569" };
};

const renderStatusBadge = (status?: string) => {
  const colors = getStatusColor(status);
  return (
    <Box
      sx={{
        ...colors,
        borderRadius: "999px",
        display: "inline-block",
        fontSize: "12px",
        fontWeight: 700,
        px: 1.5,
        py: 0.75,
        textTransform: "capitalize",
      }}
    >
      {status || "Unknown"}
    </Box>
  );
};

const formatCurrency = (value: any) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value || "0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
};

const safeParseJson = (value: string, fieldName: string) => {
  if (!value.trim()) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${fieldName} must be valid JSON.`);
  }
};

const getRooms = (response: any) => toEntityArray(response, ["rooms", "data"]);
const getBookings = (response: any) => toEntityArray(response, ["bookings", "data"]);
const getProfile = (response: any) =>
  toEntityObject(response, ["provider", "profile", "data", "user"]);
const getSettlements = (response: any) =>
  toEntityObject(response, ["summary", "settlements", "data"]);

const getRoomLabel = (room: any) =>
  room?.name || room?.title || room?.roomName || `Room ${room?._id?.slice?.(-6) || ""}`;

const getBookingGuestLabel = (booking: any) =>
  booking?.guest?.name ||
  booking?.tenant?.username ||
  booking?.tenant?.name ||
  booking?.user?.username ||
  booking?.user?.name ||
  booking?.bookedBy?.name ||
  "Guest";

const ProviderDashboard = () => {
  const userName = useTypedSelector(selectedUserName);
  const userEmail = useTypedSelector(selectedUserEmail);
  const [activeTab, setActiveTab] = useState("rooms");
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [availabilityFilters, setAvailabilityFilters] = useState({
    roomId: "",
    checkIn: "",
    checkOut: "",
  });
  const [latestBlocks, setLatestBlocks] = useState<any[]>([]);
  const [toast, setToast] = useState({
    appearence: false,
    message: "",
    type: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    body: string;
    onConfirm: ((reason?: string) => void) | null;
  }>({ open: false, title: "", body: "", onConfirm: null });
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelAction, setIsCancelAction] = useState(false);

  const { data: roomsResponse, isLoading: roomsLoading } = useGetMyRoomsQuery(undefined);
  const { data: bookingsResponse, isLoading: bookingsLoading } =
    useGetProviderBookingsQuery(undefined);
  const { data: profileResponse, isLoading: profileLoading } =
    useGetProviderProfileQuery(undefined);
  const { data: settlementsResponse, isLoading: settlementsLoading } =
    useGetProviderSettlementsSummaryQuery(undefined);

  const rooms = useMemo(() => getRooms(roomsResponse), [roomsResponse]);
  const bookings = useMemo(() => getBookings(bookingsResponse), [bookingsResponse]);
  const profile = useMemo(() => getProfile(profileResponse), [profileResponse]);
  const settlements = useMemo(
    () => getSettlements(settlementsResponse),
    [settlementsResponse]
  );

  const {
    data: availabilityResponse,
    isFetching: availabilityLoading,
    error: availabilityError,
  } = useGetRoomAvailabilityQuery(availabilityFilters, {
    skip:
      !availabilityFilters.roomId ||
      !availabilityFilters.checkIn ||
      !availabilityFilters.checkOut,
  });

  const [createRoom, { isLoading: creatingRoom }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: updatingRoom }] = useUpdateRoomMutation();
  const [deleteRoom, { isLoading: deletingRoom }] = useDeleteRoomMutation();
  const [blockRoomDates, { isLoading: blockingDates }] = useBlockRoomDatesMutation();
  const [confirmBooking, { isLoading: confirmingBooking }] =
    useConfirmBookingMutation();
  const [declineBooking, { isLoading: decliningBooking }] =
    useDeclineBookingMutation();
  const [cancelBooking, { isLoading: cancellingBooking }] = useCancelBookingMutation();
  const [updateProviderProfile, { isLoading: savingProfile }] =
    useUpdateProviderProfileMutation();

  useEffect(() => {
    if (!rooms.length) {
      return;
    }

    setBlockForm((current) => ({
      ...current,
      roomId: current.roomId || rooms[0]?._id || "",
    }));

    setAvailabilityFilters((current) => ({
      ...current,
      roomId: current.roomId || rooms[0]?._id || "",
    }));
  }, [rooms]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setProfileForm({
      businessName: profile?.businessName || profile?.providerProfile?.businessName || "",
      displayName:
        profile?.displayName ||
        profile?.name ||
        profile?.username ||
        userName ||
        "",
      phone: profile?.phone || profile?.providerProfile?.phone || "",
      bio: profile?.bio || profile?.providerProfile?.bio || "",
      location: profile?.location || profile?.providerProfile?.location || "",
      payoutDetails: profile?.payoutDetails
        ? JSON.stringify(profile.payoutDetails, null, 2)
        : "",
      policies: profile?.policies ? JSON.stringify(profile.policies, null, 2) : "",
      extraProfile: "",
    });
  }, [profile, userName]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({
      appearence: true,
      message,
      type,
    });
  };

  const resetRoomForm = () => {
    setRoomForm(emptyRoomForm);
  };

  const handleRoomSubmit = async () => {
    try {
      const extraDetails = safeParseJson(roomForm.extraDetails, "Extra details");
      const payload = {
        ...extraDetails,
        name: roomForm.name || undefined,
        title: roomForm.title || undefined,
        description: roomForm.description || undefined,
        location: roomForm.location || undefined,
        status: roomForm.status || undefined,
        image: roomForm.image || undefined,
        price: roomForm.price ? Number(roomForm.price) : undefined,
        capacity: roomForm.capacity ? Number(roomForm.capacity) : undefined,
      };

      if (roomForm.id) {
        await updateRoom({ id: roomForm.id, payload }).unwrap();
        showToast("Room updated successfully.");
      } else {
        await createRoom(payload).unwrap();
        showToast("Room created successfully.");
      }

      resetRoomForm();
    } catch (error: any) {
      showToast(getErrorMessage(error, error?.message || "Unable to save room."), "error");
    }
  };

  const handleEditRoom = (room: any) => {
    setRoomForm({
      id: room?._id || "",
      name: room?.name || "",
      title: room?.title || "",
      description: room?.description || "",
      location: room?.location || room?.address || "",
      price: room?.price?.toString?.() || room?.nightlyRate?.toString?.() || "",
      capacity: room?.capacity?.toString?.() || room?.maxGuests?.toString?.() || "",
      status: room?.status || "",
      image: room?.image || room?.coverImage || "",
      extraDetails: "",
    });
    setActiveTab("rooms");
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId).unwrap();
      showToast("Room deleted successfully.");
      if (roomForm.id === roomId) {
        resetRoomForm();
      }
    } catch (error: any) {
      showToast(getErrorMessage(error, "Unable to delete room."), "error");
    }
  };

  const handleBlockSubmit = async () => {
    if (!blockForm.roomId || !blockForm.startDate || !blockForm.endDate) {
      showToast("Select a room and both dates before blocking availability.", "error");
      return;
    }

    try {
      const response: any = await blockRoomDates({
        roomId: blockForm.roomId,
        payload: {
          startDate: new Date(blockForm.startDate).toISOString(),
          endDate: new Date(blockForm.endDate).toISOString(),
          reason: blockForm.reason || undefined,
        },
      }).unwrap();

      setLatestBlocks(toEntityArray(response, ["blockedDates", "blocks"]));
      showToast("Blocked dates updated successfully.");
    } catch (error: any) {
      showToast(getErrorMessage(error, "Unable to update blocked dates."), "error");
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    action: "confirm" | "decline" | "cancel",
    reason?: string
  ) => {
    try {
      if (action === "confirm") {
        await confirmBooking(bookingId).unwrap();
      }

      if (action === "decline") {
        await declineBooking(bookingId).unwrap();
      }

      if (action === "cancel") {
        await cancelBooking({
          id: bookingId,
          body: reason ? { reason } : undefined,
        }).unwrap();
      }

      showToast(`Booking ${action}ed successfully.`);
    } catch (error: any) {
      showToast(getErrorMessage(error, `Unable to ${action} booking.`), "error");
    }
  };

  const handleProfileSubmit = async () => {
    try {
      const payoutDetails = safeParseJson(profileForm.payoutDetails, "Payout details");
      const policies = safeParseJson(profileForm.policies, "Policies");
      const extraProfile = safeParseJson(profileForm.extraProfile, "Extra profile details");

      await updateProviderProfile({
        ...extraProfile,
        businessName: profileForm.businessName || undefined,
        displayName: profileForm.displayName || undefined,
        phone: profileForm.phone || undefined,
        bio: profileForm.bio || undefined,
        location: profileForm.location || undefined,
        payoutDetails,
        policies,
      }).unwrap();

      showToast("Provider profile updated successfully.");
      setProfileForm((current) => ({
        ...current,
        extraProfile: "",
      }));
    } catch (error: any) {
      showToast(getErrorMessage(error, error?.message || "Unable to save profile."), "error");
    }
  };

  const availabilityData = availabilityResponse?.data || availabilityResponse || {};
  const bookingOverlaps = toEntityArray(availabilityData, [
    "bookingOverlaps",
    "bookings",
    "unavailableBookings",
  ]);
  const blockedOverlaps = toEntityArray(availabilityData, [
    "blockedOverlaps",
    "blockedDates",
    "blocks",
  ]);

  const settlementCards = [
    {
      label: "Total Settled",
      value: formatCurrency(
        settlements?.totalSettled ||
          settlements?.settledAmount ||
          settlements?.totalPaid ||
          0
      ),
    },
    {
      label: "Pending Payout",
      value: formatCurrency(
        settlements?.pendingPayout ||
          settlements?.pendingAmount ||
          settlements?.outstandingBalance ||
          0
      ),
    },
    {
      label: "Upcoming Payout",
      value: settlements?.nextPayoutDate
        ? formatDate(settlements.nextPayoutDate)
        : settlements?.upcomingPayout
          ? formatCurrency(settlements.upcomingPayout)
          : "Not scheduled",
    },
  ];

  const isInitialLoading =
    roomsLoading || bookingsLoading || profileLoading || settlementsLoading;
  const isRoomSaving = creatingRoom || updatingRoom;
  const isBookingActionLoading =
    confirmingBooking || decliningBooking || cancellingBooking;

  return (
    <Box sx={{ mt: { xs: 5, md: 6 }, mb: 6 }}>
      <AppContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Heading>Provider Dashboard</Heading>
            <SubHeading sx={{ mt: 0.5 }}>
              Manage rooms, booking actions, blocked dates, profile updates, and
              settlements from one place.
            </SubHeading>
          </Box>
          <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
            <SubHeading sx={{ color: "#1F4D3A", fontWeight: 700 }}>
              {userName || profile?.displayName || "Provider"}
            </SubHeading>
            <SubHeading>{userEmail || profile?.email || "No email on file"}</SubHeading>
          </Box>
        </Box>

        {isInitialLoading ? (
          <OverlayLoader />
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <AppCard sx={{ p: 2.5 }}>
                  <SubHeading>Total Rooms</SubHeading>
                  <Heading sx={{ fontSize: "34px", mt: 1 }}>{rooms.length}</Heading>
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard sx={{ p: 2.5 }}>
                  <SubHeading>Active Bookings</SubHeading>
                  <Heading sx={{ fontSize: "34px", mt: 1 }}>
                    {
                      bookings.filter((booking: any) =>
                        ["pending", "confirmed", "active"].includes(
                          String(booking?.status || "").toLowerCase()
                        )
                      ).length
                    }
                  </Heading>
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard sx={{ p: 2.5 }}>
                  <SubHeading>Pending Payout</SubHeading>
                  <Heading sx={{ fontSize: "34px", mt: 1 }}>
                    {formatCurrency(
                      settlements?.pendingPayout ||
                        settlements?.pendingAmount ||
                        settlements?.outstandingBalance ||
                        0
                    )}
                  </Heading>
                </AppCard>
              </Grid>
            </Grid>

            <AppCard sx={{ p: 1, mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_event, nextValue) => setActiveTab(nextValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {tabs.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
            </AppCard>

            {activeTab === "rooms" ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={5}>
                  <AppCard sx={{ p: 3 }}>
                    <Heading sx={{ fontSize: "24px", mb: 2 }}>
                      {roomForm.id ? "Edit Room" : "Create Room"}
                    </Heading>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Name"
                          value={roomForm.name}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Title"
                          value={roomForm.title}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppInput
                          label="Description"
                          value={roomForm.description}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          multiline
                          minRows={3}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppInput
                          label="Location"
                          value={roomForm.location}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              location: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Price"
                          type="number"
                          value={roomForm.price}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              price: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Capacity"
                          type="number"
                          value={roomForm.capacity}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              capacity: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Status"
                          value={roomForm.status}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              status: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Image URL"
                          value={roomForm.image}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              image: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppInput
                          label="Extra Details JSON"
                          value={roomForm.extraDetails}
                          onChange={(event) =>
                            setRoomForm((current) => ({
                              ...current,
                              extraDetails: event.target.value,
                            }))
                          }
                          multiline
                          minRows={5}
                          placeholder='{"amenities":["wifi","parking"]}'
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap" }}>
                      <AppButton onClick={handleRoomSubmit} disabled={isRoomSaving}>
                        {isRoomSaving ? "Saving..." : roomForm.id ? "Update Room" : "Create Room"}
                      </AppButton>
                      {roomForm.id ? (
                        <AppButton variant="outlined" onClick={resetRoomForm}>
                          Reset
                        </AppButton>
                      ) : null}
                    </Box>
                  </AppCard>
                </Grid>
                <Grid item xs={12} lg={7}>
                  <AppCard sx={{ p: 0 }}>
                    {rooms.length === 0 ? (
                      <Box sx={{ p: 3 }}>
                        <SubHeading>No rooms yet. Create your first room.</SubHeading>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ background: "#f8fafc" }}>
                              <TableCell>Name</TableCell>
                              <TableCell>Location</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rooms.map((room: any) => (
                              <TableRow key={room?._id} hover>
                                <TableCell>{getRoomLabel(room)}</TableCell>
                                <TableCell>{room?.location || room?.address || "-"}</TableCell>
                                <TableCell>
                                  {formatCurrency(room?.price || room?.nightlyRate || 0)}
                                </TableCell>
                                <TableCell>{renderStatusBadge(room?.status)}</TableCell>
                                <TableCell align="right">
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      gap: 1,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <AppButton
                                      variant="outlined"
                                      onClick={() => handleEditRoom(room)}
                                    >
                                      Edit
                                    </AppButton>
                                    <AppButton
                                      variant="outlined"
                                      onClick={() =>
                                        setAvailabilityFilters((current) => ({
                                          ...current,
                                          roomId: room?._id || "",
                                        }))
                                      }
                                    >
                                      Availability
                                    </AppButton>
                                    <AppButton
                                      color="error"
                                      onClick={() => {
                                        setConfirmDialog({
                                          open: true,
                                          title: "Delete Room",
                                          body: "Delete this room? All associated availability data will be removed.",
                                          onConfirm: () => handleDeleteRoom(room?._id),
                                        });
                                        setIsCancelAction(false);
                                      }}
                                      disabled={deletingRoom}
                                    >
                                      Delete
                                    </AppButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AppCard>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === "bookings" ? (
              <AppCard sx={{ p: 0 }}>
                {bookings.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <SubHeading>No provider bookings available yet.</SubHeading>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: "#f8fafc" }}>
                          <TableCell>Guest</TableCell>
                          <TableCell>Room</TableCell>
                          <TableCell>Stay</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((booking: any) => (
                          <TableRow key={booking?._id} hover>
                            <TableCell>{getBookingGuestLabel(booking)}</TableCell>
                            <TableCell>
                              {getRoomLabel(booking?.room || { name: booking?.roomName })}
                            </TableCell>
                            <TableCell>
                              {booking?.checkIn ? formatDate(booking.checkIn) : "-"} to{" "}
                              {booking?.checkOut ? formatDate(booking.checkOut) : "-"}
                            </TableCell>
                            <TableCell>{renderStatusBadge(booking?.status)}</TableCell>
                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <AppButton
                                  variant="outlined"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      title: "Confirm Booking",
                                      body: "Confirm this booking? The guest will be notified.",
                                      onConfirm: () =>
                                        handleBookingAction(booking?._id, "confirm"),
                                    });
                                    setIsCancelAction(false);
                                  }}
                                  disabled={isBookingActionLoading}
                                >
                                  Confirm
                                </AppButton>
                                <AppButton
                                  variant="outlined"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      title: "Decline Booking",
                                      body: "Decline this booking? The guest will be notified.",
                                      onConfirm: () =>
                                        handleBookingAction(booking?._id, "decline"),
                                    });
                                    setIsCancelAction(false);
                                  }}
                                  disabled={isBookingActionLoading}
                                >
                                  Decline
                                </AppButton>
                                <AppButton
                                  color="error"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      title: "Cancel Booking",
                                      body: "Cancel this booking?",
                                      onConfirm: (reason) =>
                                        handleBookingAction(booking?._id, "cancel", reason),
                                    });
                                    setIsCancelAction(true);
                                    setCancelReason("");
                                  }}
                                  disabled={isBookingActionLoading}
                                >
                                  Cancel
                                </AppButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AppCard>
            ) : null}

            {activeTab === "availability" ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={5}>
                  <AppCard sx={{ p: 3 }}>
                    <Heading sx={{ fontSize: "24px", mb: 2 }}>Block Dates</Heading>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <AppInput
                          select
                          label="Room"
                          value={blockForm.roomId}
                          onChange={(event) =>
                            setBlockForm((current) => ({
                              ...current,
                              roomId: event.target.value,
                            }))
                          }
                        >
                          {rooms.map((room: any) => (
                            <MenuItem key={room?._id} value={room?._id}>
                              {getRoomLabel(room)}
                            </MenuItem>
                          ))}
                        </AppInput>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Start Date"
                          type="date"
                          value={blockForm.startDate}
                          onChange={(event) =>
                            setBlockForm((current) => ({
                              ...current,
                              startDate: event.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="End Date"
                          type="date"
                          value={blockForm.endDate}
                          onChange={(event) =>
                            setBlockForm((current) => ({
                              ...current,
                              endDate: event.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppInput
                          label="Reason"
                          value={blockForm.reason}
                          onChange={(event) =>
                            setBlockForm((current) => ({
                              ...current,
                              reason: event.target.value,
                            }))
                          }
                        />
                      </Grid>
                    </Grid>
                    <AppButton
                      sx={{ mt: 2.5 }}
                      onClick={handleBlockSubmit}
                      disabled={blockingDates}
                    >
                      {blockingDates ? "Saving..." : "Block Dates"}
                    </AppButton>

                    {latestBlocks.length ? (
                      <Box sx={{ mt: 3 }}>
                        <SubHeading sx={{ mb: 1.5 }}>Current Blocks</SubHeading>
                        {latestBlocks.map((block: any) => (
                          <Box
                            key={block?._id || `${block?.startDate}-${block?.endDate}`}
                            sx={{
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              p: 1.5,
                              mb: 1,
                            }}
                          >
                            <Box sx={{ fontWeight: 600 }}>
                              {formatDate(block?.startDate)} to {formatDate(block?.endDate)}
                            </Box>
                            <SubHeading>{block?.reason || "No reason provided"}</SubHeading>
                          </Box>
                        ))}
                      </Box>
                    ) : null}
                  </AppCard>
                </Grid>
                <Grid item xs={12} lg={7}>
                  <AppCard sx={{ p: 3 }}>
                    <Heading sx={{ fontSize: "24px", mb: 2 }}>
                      Availability Check
                    </Heading>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <AppInput
                          select
                          label="Room"
                          value={availabilityFilters.roomId}
                          onChange={(event) =>
                            setAvailabilityFilters((current) => ({
                              ...current,
                              roomId: event.target.value,
                            }))
                          }
                        >
                          {rooms.map((room: any) => (
                            <MenuItem key={room?._id} value={room?._id}>
                              {getRoomLabel(room)}
                            </MenuItem>
                          ))}
                        </AppInput>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Check In"
                          type="date"
                          value={availabilityFilters.checkIn}
                          onChange={(event) =>
                            setAvailabilityFilters((current) => ({
                              ...current,
                              checkIn: event.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <AppInput
                          label="Check Out"
                          type="date"
                          value={availabilityFilters.checkOut}
                          onChange={(event) =>
                            setAvailabilityFilters((current) => ({
                              ...current,
                              checkOut: event.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>

                    {availabilityLoading ? (
                      <Box sx={{ mt: 3 }}>
                        <OverlayLoader />
                      </Box>
                    ) : availabilityError ? (
                      <Alert severity="error" sx={{ mt: 3 }}>
                        {getErrorMessage(
                          availabilityError,
                          "Unable to load availability for the selected range."
                        )}
                      </Alert>
                    ) : (
                      <Box sx={{ mt: 3 }}>
                        <SubHeading sx={{ mb: 1.5 }}>
                          Availability summary for the selected date range
                        </SubHeading>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <AppCard
                              sx={{
                                p: 2,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <SubHeading sx={{ mb: 1 }}>Booking overlaps</SubHeading>
                              <Heading sx={{ fontSize: "28px" }}>
                                {bookingOverlaps.length}
                              </Heading>
                            </AppCard>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <AppCard
                              sx={{
                                p: 2,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <SubHeading sx={{ mb: 1 }}>Blocked ranges</SubHeading>
                              <Heading sx={{ fontSize: "28px" }}>
                                {blockedOverlaps.length}
                              </Heading>
                            </AppCard>
                          </Grid>
                        </Grid>

                        {bookingOverlaps.length ? (
                          <Box sx={{ mt: 2.5 }}>
                            <SubHeading sx={{ mb: 1 }}>Conflicting bookings</SubHeading>
                            {bookingOverlaps.map((booking: any) => (
                              <Box
                                key={booking?._id}
                                sx={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  p: 1.5,
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ fontWeight: 700 }}>
                                  {getBookingGuestLabel(booking)}
                                </Box>
                                <SubHeading>
                                  {booking?.checkIn ? formatDate(booking.checkIn) : "-"} to{" "}
                                  {booking?.checkOut ? formatDate(booking.checkOut) : "-"}
                                </SubHeading>
                              </Box>
                            ))}
                          </Box>
                        ) : null}

                        {blockedOverlaps.length ? (
                          <Box sx={{ mt: 2.5 }}>
                            <SubHeading sx={{ mb: 1 }}>Blocked dates</SubHeading>
                            {blockedOverlaps.map((block: any) => (
                              <Box
                                key={block?._id || `${block?.startDate}-${block?.endDate}`}
                                sx={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  p: 1.5,
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ fontWeight: 700 }}>
                                  {formatDate(block?.startDate)} to {formatDate(block?.endDate)}
                                </Box>
                                <SubHeading>{block?.reason || "Blocked by provider"}</SubHeading>
                              </Box>
                            ))}
                          </Box>
                        ) : null}
                      </Box>
                    )}
                  </AppCard>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === "profile" ? (
              <AppCard sx={{ p: 3 }}>
                <Heading sx={{ fontSize: "24px", mb: 2 }}>Provider Profile</Heading>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <AppInput
                      label="Business Name"
                      value={profileForm.businessName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          businessName: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <AppInput
                      label="Display Name"
                      value={profileForm.displayName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <AppInput
                      label="Phone"
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <AppInput
                      label="Location"
                      value={profileForm.location}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <AppInput
                      label="Bio"
                      value={profileForm.bio}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                      multiline
                      minRows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <AppInput
                      label="Payout Details JSON"
                      value={profileForm.payoutDetails}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          payoutDetails: event.target.value,
                        }))
                      }
                      multiline
                      minRows={5}
                      placeholder='{"bankName":"Example Bank","accountNumber":"****"}'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <AppInput
                      label="Policies JSON"
                      value={profileForm.policies}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          policies: event.target.value,
                        }))
                      }
                      multiline
                      minRows={5}
                      placeholder='{"checkIn":"2pm","cancellation":"48 hours"}'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <AppInput
                      label="Extra Profile Details JSON"
                      value={profileForm.extraProfile}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          extraProfile: event.target.value,
                        }))
                      }
                      multiline
                      minRows={4}
                      placeholder='{"supportEmail":"host@example.com"}'
                    />
                  </Grid>
                </Grid>
                <AppButton sx={{ mt: 2.5 }} onClick={handleProfileSubmit} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </AppButton>
              </AppCard>
            ) : null}

            {activeTab === "settlements" ? (
              <Grid container spacing={3}>
                {settlementCards.map((card) => (
                  <Grid item xs={12} md={4} key={card.label}>
                    <AppCard sx={{ p: 3 }}>
                      <SubHeading>{card.label}</SubHeading>
                      <Heading sx={{ fontSize: "30px", mt: 1 }}>{card.value}</Heading>
                    </AppCard>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <AppCard sx={{ p: 3 }}>
                    <Heading sx={{ fontSize: "24px", mb: 2 }}>
                      Settlement Summary
                    </Heading>
                    {settlements && Object.keys(settlements).length ? (
                      <Grid container spacing={2}>
                        {Object.entries(settlements).map(([key, value]) => (
                          <Grid item xs={12} md={6} key={key}>
                            <Box
                              sx={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                p: 2,
                                height: "100%",
                              }}
                            >
                              <SubHeading sx={{ textTransform: "capitalize", mb: 0.75 }}>
                                {key.replace(/([A-Z])/g, " $1")}
                              </SubHeading>
                              <Box sx={{ fontWeight: 700 }}>
                                {typeof value === "string" && value.includes("T")
                                  ? convertToFormattedDate(value)
                                  : typeof value === "number"
                                    ? formatCurrency(value)
                                    : Array.isArray(value) || typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <SubHeading>No settlement summary available yet.</SubHeading>
                    )}
                  </AppCard>
                </Grid>
              </Grid>
            ) : null}
          </>
        )}
      </AppContainer>
      <ToastAlert
        appearence={toast.appearence}
        type={toast.type}
        message={toast.message}
        handleClose={() => setToast((current) => ({ ...current, appearence: false }))}
      />
      <Dialog
        open={confirmDialog.open}
        onClose={() => {
          setConfirmDialog({ open: false, title: "", body: "", onConfirm: null });
          setCancelReason("");
          setIsCancelAction(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: isCancelAction ? 2 : 0 }}>
            {confirmDialog.body}
          </DialogContentText>
          {isCancelAction === true ? (
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Cancellation reason"
              required
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <AppButton
            variant="outlined"
            onClick={() => {
              setConfirmDialog({ open: false, title: "", body: "", onConfirm: null });
              setCancelReason("");
              setIsCancelAction(false);
            }}
          >
            Go Back
          </AppButton>
          <AppButton
            disabled={
              isBookingActionLoading ||
              deletingRoom ||
              (isCancelAction && !cancelReason.trim())
            }
            onClick={() => {
              confirmDialog.onConfirm?.(cancelReason.trim());
              setConfirmDialog({ open: false, title: "", body: "", onConfirm: null });
              setCancelReason("");
              setIsCancelAction(false);
            }}
          >
            Confirm
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProviderDashboard;
