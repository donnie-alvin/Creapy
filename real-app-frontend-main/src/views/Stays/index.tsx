import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Drawer,
  Fab,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaLocationDot, FaSliders, FaUserGroup } from "react-icons/fa6";
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppSelect from "../../components/ui/AppSelect";
import DotLoader from "../../components/Spinner/dotLoader";
import { StaySearchParams, useSearchStaysQuery } from "../../redux/api/stayApiSlice";
import { thousandSeparatorNumber } from "../../utils";

type StayFilterState = StaySearchParams & {
  amenities: string[];
};

export const BUSINESS_TYPES = [
  { label: "All", value: "" },
  { label: "Hotel", value: "hotel" },
  { label: "Lodge", value: "lodge" },
  { label: "BnB", value: "bnb" },
  { label: "Guesthouse", value: "guesthouse" },
  { label: "Motel", value: "motel" },
  { label: "Backpackers", value: "backpackers" },
];

const AMENITY_OPTIONS = [
  { label: "Wi-Fi", value: "Wi-Fi" },
  { label: "Breakfast Included", value: "Breakfast Included" },
  { label: "Secure Parking", value: "Secure Parking" },
  { label: "Swimming Pool", value: "Swimming Pool" },
  { label: "Air Conditioning", value: "Air Conditioning" },
  { label: "Conference Room", value: "Conference Room" },
  { label: "Airport Pickup", value: "Airport Pickup" },
  { label: "Family Friendly", value: "Family Friendly" },
];

const SORT_OPTIONS = [
  { label: "Price Low to High", value: "price_asc" },
  { label: "Price High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
];

const getRoomName = (room: any) =>
  room?.name || room?.title || room?.roomType || room?.type || "Temporary stay";

const getRoomLocation = (room: any) =>
  room?.location || room?.address || room?.city || room?.province || "Location unavailable";

const getRoomDescription = (room: any) =>
  room?.description || room?.summary || room?.details || "No description available yet.";

const getRoomImage = (room: any) => {
  if (Array.isArray(room?.images) && room.images.length > 0) return room.images[0];
  if (typeof room?.image === "string") return room.image;
  if (typeof room?.coverImage === "string") return room.coverImage;
  return "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";
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

const readParams = (searchParams: URLSearchParams): StayFilterState => ({
  location: searchParams.get("location") || "",
  checkIn: searchParams.get("checkIn") || "",
  checkOut: searchParams.get("checkOut") || "",
  guests: searchParams.get("guests") || "1",
  minPrice: searchParams.get("minPrice") || "",
  maxPrice: searchParams.get("maxPrice") || "",
  searchTerm: searchParams.get("searchTerm") || "",
  businessType: searchParams.get("businessType") || "",
  bookingMode: searchParams.get("bookingMode") || "",
  amenities: searchParams.getAll("amenities"),
  sort: searchParams.get("sort") || "",
});

const buildSearchParams = (filters: StayFilterState) => {
  const nextSearchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "amenities") {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((amenity) => nextSearchParams.append(key, amenity));
      }
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      nextSearchParams.set(key, String(value));
    }
  });

  return nextSearchParams;
};

const buildQueryParams = (filters: StayFilterState): StaySearchParams => {
  const params: Record<string, any> = {
    location: filters.location,
    guests: filters.guests,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    searchTerm: filters.searchTerm,
    businessType: filters.businessType,
    bookingMode: filters.bookingMode,
    amenities: filters.amenities,
    sort: filters.sort,
  };

  if (filters.checkIn && filters.checkOut) {
    const checkIn = new Date(filters.checkIn);
    const checkOut = new Date(filters.checkOut);

    if (!Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime()) && checkIn < checkOut) {
      params.checkIn = filters.checkIn;
      params.checkOut = filters.checkOut;
    }
  }

  return params;
};

const Stays = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const currentFilters = useMemo(() => readParams(searchParams), [searchParams]);
  const [form, setForm] = useState<StayFilterState>(currentFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setForm(currentFilters);
  }, [currentFilters]);

  const queryParams = useMemo(() => buildQueryParams(currentFilters), [currentFilters]);
  const {
    data: stays = [],
    isLoading,
    isFetching,
    error,
  } = useSearchStaysQuery(queryParams);

  const sortedStays = useMemo(() => {
    const nextStays = [...stays];

    switch (currentFilters.sort) {
      case "price_asc":
        return nextStays.sort((a, b) => getRoomPrice(a) - getRoomPrice(b));
      case "price_desc":
        return nextStays.sort((a, b) => getRoomPrice(b) - getRoomPrice(a));
      case "newest":
        return nextStays.sort((a, b) => {
          const left = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
          const right = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
          return right - left;
        });
      default:
        return nextStays;
    }
  }, [currentFilters.sort, stays]);

  const applyFilters = (nextFilters: StayFilterState) => {
    setForm(nextFilters);
    setSearchParams(buildSearchParams(nextFilters));
  };

  const updateField = (field: keyof StayFilterState, value: any) => {
    applyFilters({
      ...form,
      [field]: value,
    });
  };

  const toggleAmenity = (amenityValue: string) => {
    const nextAmenities = form.amenities.includes(amenityValue)
      ? form.amenities.filter((item) => item !== amenityValue)
      : [...form.amenities, amenityValue];

    applyFilters({
      ...form,
      amenities: nextAmenities,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters(form);
  };

  const renderFilters = () => (
    <Stack spacing={2}>
      <AppCard sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Heading sx={{ fontSize: "20px" }}>Price per Night</Heading>
          <AppInput
            label="Minimum"
            type="number"
            value={form.minPrice || ""}
            onChange={(event) => updateField("minPrice", event.target.value)}
            inputProps={{ min: 0 }}
          />
          <AppInput
            label="Maximum"
            type="number"
            value={form.maxPrice || ""}
            onChange={(event) => updateField("maxPrice", event.target.value)}
            inputProps={{ min: 0 }}
          />
        </Stack>
      </AppCard>

      <AppCard sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={1.25}>
          <Heading sx={{ fontSize: "20px" }}>Amenities</Heading>
          {AMENITY_OPTIONS.map((amenity) => (
            <FormControlLabel
              key={amenity.value}
              control={
                <Checkbox
                  checked={form.amenities.includes(amenity.value)}
                  onChange={() => toggleAmenity(amenity.value)}
                />
              }
              label={amenity.label}
              sx={{ alignItems: "flex-start", m: 0 }}
            />
          ))}
        </Stack>
      </AppCard>

      <AppCard sx={{ p: 2.5, borderRadius: 3 }}>
        <Stack spacing={1.25}>
          <Heading sx={{ fontSize: "20px" }}>Booking Type</Heading>
          <RadioGroup
            value={form.bookingMode || ""}
            onChange={(event) => updateField("bookingMode", event.target.value)}
          >
            <FormControlLabel value="" control={<Radio />} label="All" />
            <FormControlLabel value="instant" control={<Radio />} label="Instant" />
            <FormControlLabel value="request" control={<Radio />} label="Request to Book" />
          </RadioGroup>
        </Stack>
      </AppCard>
    </Stack>
  );

  const statusMessage = (error as any)?.data?.message || "Unable to load stays right now.";

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, background: "#f8fafc", minHeight: "calc(100vh - 72px)" }}>
      <AppContainer>
        <Stack spacing={3}>
          <AppCard
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 4,
              background:
                "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.96) 45%, rgba(15,118,110,0.88) 100%)",
              color: "#fff",
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Heading sx={{ mb: 1, color: "#fff" }}>Temporary Stays</Heading>
                <SubHeading sx={{ color: "rgba(255,255,255,0.8)" }}>
                  Search short-stay rooms, compare nightly pricing, and move straight into the booking flow.
                </SubHeading>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} md={3}>
                    <AppInput
                      label="Location"
                      value={form.location || ""}
                      onChange={(event) => updateField("location", event.target.value)}
                      placeholder="Harare"
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiInputBase-root": { background: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <AppInput
                      label="Check-in"
                      type="date"
                      value={form.checkIn || ""}
                      onChange={(event) => updateField("checkIn", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiInputBase-root": { background: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <AppInput
                      label="Check-out"
                      type="date"
                      value={form.checkOut || ""}
                      onChange={(event) => updateField("checkOut", event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiInputBase-root": { background: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <AppInput
                      label="Guests"
                      type="number"
                      value={form.guests || "1"}
                      onChange={(event) => updateField("guests", event.target.value)}
                      inputProps={{ min: 1 }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiInputBase-root": { background: "#fff" } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <AppInput
                      label="Search"
                      value={form.searchTerm || ""}
                      onChange={(event) => updateField("searchTerm", event.target.value)}
                      placeholder="Suite, wifi, city center..."
                      InputLabelProps={{ shrink: true }}
                      sx={{ "& .MuiInputBase-root": { background: "#fff" } }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <AppButton type="submit" size="large" sx={{ background: "#fff", color: "#0f172a" }}>
                    Search stays
                  </AppButton>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {BUSINESS_TYPES.map((type) => {
                  const isActive = (form.businessType || "") === type.value;

                  return (
                    <Chip
                      key={type.label}
                      label={type.label}
                      color={isActive ? "primary" : "default"}
                      variant={isActive ? "filled" : "outlined"}
                      onClick={() => updateField("businessType", type.value)}
                      sx={{
                        color: isActive ? "#fff" : "#fff",
                        borderColor: "rgba(255,255,255,0.3)",
                        backgroundColor: isActive ? "#0f766e" : "rgba(255,255,255,0.08)",
                      }}
                    />
                  );
                })}
              </Stack>
            </Stack>
          </AppCard>

          {error ? <Alert severity="error">{statusMessage}</Alert> : null}

          {isLoading || isFetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <DotLoader />
            </Box>
          ) : null}

          {!isLoading && !isFetching && !error && (
            <Grid container spacing={3}>
              {!isMobile ? (
                <Grid item xs={12} md={3}>
                  <Box sx={{ position: "sticky", top: 96 }}>{renderFilters()}</Box>
                </Grid>
              ) : null}

              <Grid item xs={12} md={isMobile ? 12 : 9}>
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      alignItems: "center",
                      flexWrap: "wrap",
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <SubHeading sx={{ color: "#334155" }}>
                      {sortedStays.length} results
                    </SubHeading>
                    <Box sx={{ minWidth: 200, maxWidth: 300, flex: "0 0 auto", width: { xs: "100%" } }}>
                      <AppSelect
                        label="Sort"
                        value={form.sort || ""}
                        onChange={(event) => updateField("sort", event.target.value)}
                        options={SORT_OPTIONS}
                      />
                    </Box>
                  </Box>

                  {sortedStays.length === 0 ? (
                    <Alert severity="info">
                      No temporary stays matched the current filters. Adjust the dates, price, or amenities and try again.
                    </Alert>
                  ) : (
                    <Grid container spacing={2.5}>
                      {sortedStays.map((room: any) => {
                        const price = getRoomPrice(room);
                        const query = new URLSearchParams();

                        if (currentFilters.checkIn) query.set("checkIn", String(currentFilters.checkIn));
                        if (currentFilters.checkOut) query.set("checkOut", String(currentFilters.checkOut));
                        if (currentFilters.guests) query.set("guests", String(currentFilters.guests));

                        return (
                          <Grid item xs={12} md={6} xl={4} key={room?._id || room?.id}>
                            <AppCard
                              sx={{
                                height: "100%",
                                borderRadius: 3,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <Box
                                component="img"
                                src={getRoomImage(room)}
                                alt={getRoomName(room)}
                                sx={{ height: 220, objectFit: "cover", width: "100%" }}
                              />
                              <Box
                                sx={{
                                  p: 2.5,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1.5,
                                  flex: 1,
                                }}
                              >
                                <Heading sx={{ fontSize: "22px" }}>{getRoomName(room)}</Heading>
                                <Box
                                  sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}
                                >
                                  <FaLocationDot />
                                  <SubHeading>{getRoomLocation(room)}</SubHeading>
                                </Box>
                                <Box
                                  sx={{ display: "flex", alignItems: "center", gap: 1, color: "#475569" }}
                                >
                                  <FaUserGroup />
                                  <SubHeading>Up to {getRoomCapacity(room)} guests</SubHeading>
                                </Box>
                                <SubHeading
                                  sx={{
                                    color: "#334155",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {getRoomDescription(room)}
                                </SubHeading>
                                <Box
                                  sx={{
                                    mt: "auto",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                  }}
                                >
                                  <Box sx={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
                                    ${thousandSeparatorNumber(price)}
                                    <Box
                                      component="span"
                                      sx={{ fontSize: "14px", color: "#64748b", ml: 0.5 }}
                                    >
                                      /night
                                    </Box>
                                  </Box>
                                  <AppButton
                                    onClick={() =>
                                      navigate(`/stays/rooms/${room?._id || room?.id}?${query.toString()}`)
                                    }
                                  >
                                    View details
                                  </AppButton>
                                </Box>
                              </Box>
                            </AppCard>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </Stack>
      </AppContainer>

      {isMobile ? (
        <>
          <Drawer
            anchor="bottom"
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: "20px 20px 0 0",
                padding: 2,
                maxHeight: "85vh",
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 4,
                borderRadius: "999px",
                background: "#cbd5e1",
                margin: "0 auto 16px",
              }}
            />
            {renderFilters()}
          </Drawer>
          {!mobileFiltersOpen ? (
            <Fab
              variant="extended"
              onClick={() => setMobileFiltersOpen(true)}
              sx={{
                position: "fixed",
                bottom: 24,
                right: 20,
                background: "#0f766e",
                color: "#fff",
                "&:hover": {
                  background: "#115e59",
                },
              }}
            >
              <FaSliders style={{ marginRight: 8 }} />
              Filters
            </Fab>
          ) : null}
        </>
      ) : null}
    </Box>
  );
};

export default Stays;
