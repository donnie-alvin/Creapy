// MUI Imports
import { Box, Grid, Menu, MenuItem } from "@mui/material";
// React Imports
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Custom Imports
import { Heading, SubHeading } from "../../components/Heading";
// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css/free-mode";
import "swiper/css";
import {
  useGetHomeGroupedByLocationQuery,
  useGetHomeHighlightedQuery,
} from "../../redux/api/listingApiSlice";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import { ZIMBABWE_PROVINCES } from "../../config/zimbabweProvinces";
import {
  studentAccommodationOverlayBadgeSx,
} from "../../styles/listingBadges";

const Banner = {
  width: "100%",
  height: "fit-content",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "12px",
  background: "none",
  cursor: "pointer",
};

const images = [
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const Home = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");
  const [locationAnchor, setLocationAnchor] = useState<null | HTMLElement>(null);
  const [roomsAnchor, setRoomsAnchor] = useState<null | HTMLElement>(null);
  const [priceAnchor, setPriceAnchor] = useState<null | HTMLElement>(null);
  const [amenitiesAnchor, setAmenitiesAnchor] = useState<null | HTMLElement>(null);

  const { data: highlightedData, isLoading: highlightedLoading } =
    useGetHomeHighlightedQuery(5);
  const {
    data: groupedByLocationData,
    isLoading: groupedByLocationLoading,
    isError: groupedByLocationError,
  } = useGetHomeGroupedByLocationQuery({ locationsLimit: 6, perLocation: 3 });

  const highlightedHeroListings = highlightedData?.data || [];
  const groupedSlides = groupedByLocationData?.data || [];

  const getListingImage = (item: any) =>
    item?.image || item?.images?.[0] || item?.imageUrls?.[0] || null;

  // Never block the whole landing page forever.
  // If the API is down or DB isn't connected, show the page and allow retry.
  const [showOverlay, setShowOverlay] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const anyLoading =
      highlightedLoading || groupedByLocationLoading;
    if (!anyLoading) {
      setShowOverlay(false);
      setTimedOut(false);
      return;
    }

    // small delay to avoid flicker
    const t1 = window.setTimeout(() => setShowOverlay(true), 250);
    // hard timeout: stop showing overlay and show an error hint
    const t2 = window.setTimeout(() => {
      setShowOverlay(false);
      setTimedOut(true);
    }, 8000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [highlightedLoading, groupedByLocationLoading]);

  const navigateToSearch = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      }
    });
    navigate(`/search?${urlParams.toString()}`);
  };

  const filterButtonSx = {
    background: "#f1f5f9",
    color: "#334155",
    borderRadius: "999px",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    fontWeight: 600,
  };

  const handleHeroSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!heroSearch.trim()) {
      navigate("/search");
      return;
    }
    const urlParams = new URLSearchParams();
    urlParams.set("searchTerm", heroSearch.trim().toLowerCase());
    navigate(`/search?${urlParams.toString()}`);
  };

  return (
    <Box
      sx={{
        mt: { xs: 5, md: 7.5 },
      }}
    >
      {showOverlay && <OverlayLoader />}
      {timedOut && (
        <AppContainer>
          <Box
            sx={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#334155",
              fontSize: "14px",
            }}
          >
            Listings are taking too long to load. Make sure the backend is running on
            <b></b> and MongoDB is connected, then refresh.
          </Box>
        </AppContainer>
      )}
      <AppContainer sx={{ marginTop: { xs: 2, md: 3 } }}>
        <AppCard sx={{ p: { xs: 2, md: 3 } }}>
          <Box component="form" onSubmit={handleHeroSubmit}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <AppInput
                placeholder="Search by location, address, or keyword"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
              <AppButton
                type="submit"
                sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}
              >
                Search Properties
              </AppButton>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 2 }}>
              <Box
                component="button"
                type="button"
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  setLocationAnchor(e.currentTarget)
                }
                sx={filterButtonSx}
              >
                📍 Location ▾
              </Box>
              <Menu
                anchorEl={locationAnchor}
                open={Boolean(locationAnchor)}
                onClose={() => setLocationAnchor(null)}
              >
                {ZIMBABWE_PROVINCES.map((province) => (
                  <MenuItem
                    key={province.value}
                    onClick={() => {
                      setLocationAnchor(null);
                      navigateToSearch({ location: province.value });
                    }}
                  >
                    {province.label}
                  </MenuItem>
                ))}
              </Menu>
              <Box
                component="button"
                type="button"
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  setRoomsAnchor(e.currentTarget)
                }
                sx={filterButtonSx}
              >
                🏠 Rooms ▾
              </Box>
              <Menu
                anchorEl={roomsAnchor}
                open={Boolean(roomsAnchor)}
                onClose={() => setRoomsAnchor(null)}
              >
                {[1, 2, 3, 4, 5, 6].map((rooms) => (
                  <MenuItem
                    key={rooms}
                    onClick={() => {
                      setRoomsAnchor(null);
                      navigateToSearch({ minTotalRooms: String(rooms) });
                    }}
                  >
                    {rooms}+ rooms
                  </MenuItem>
                ))}
              </Menu>
              <Box
                component="button"
                type="button"
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  setPriceAnchor(e.currentTarget)
                }
                sx={filterButtonSx}
              >
                💰 Price ▾
              </Box>
              <Menu
                anchorEl={priceAnchor}
                open={Boolean(priceAnchor)}
                onClose={() => setPriceAnchor(null)}
              >
                {[
                  {
                    label: "Under $200",
                    query: "maxRent=200",
                  },
                  {
                    label: "$200 - $500",
                    query: "minRent=200&maxRent=500",
                  },
                  {
                    label: "$500 - $1,000",
                    query: "minRent=500&maxRent=1000",
                  },
                  {
                    label: "$1,000 - $2,000",
                    query: "minRent=1000&maxRent=2000",
                  },
                  {
                    label: "Over $2,000",
                    query: "minRent=2000",
                  },
                ].map((band) => (
                  <MenuItem
                    key={band.label}
                    onClick={() => {
                      setPriceAnchor(null);
                      navigate(`/search?${band.query}`);
                    }}
                  >
                    {band.label}
                  </MenuItem>
                ))}
              </Menu>
              <Box
                component="button"
                type="button"
                onClick={(e: React.MouseEvent<HTMLElement>) =>
                  setAmenitiesAnchor(e.currentTarget)
                }
                sx={filterButtonSx}
              >
                ✨ Amenities ▾
              </Box>
              <Menu
                anchorEl={amenitiesAnchor}
                open={Boolean(amenitiesAnchor)}
                onClose={() => setAmenitiesAnchor(null)}
              >
                {[
                  { label: "Solar", query: "solar=true" },
                  { label: "Borehole", query: "borehole=true" },
                  { label: "Security", query: "security=true" },
                  { label: "Parking", query: "parking=true" },
                  { label: "Internet", query: "internet=true" },
                ].map((amenity) => (
                  <MenuItem
                    key={amenity.label}
                    onClick={() => {
                      setAmenitiesAnchor(null);
                      navigate(`/search?${amenity.query}`);
                    }}
                  >
                    {amenity.label}
                  </MenuItem>
                ))}
              </Menu>
              <Box
                component="button"
                type="button"
                onClick={() => navigate("/search")}
                sx={{
                  background: "none",
                  border: "none",
                  color: "#1F4D3A",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                More Options →
              </Box>
            </Box>
          </Box>
        </AppCard>
      </AppContainer>

      {!highlightedLoading && highlightedHeroListings.length > 0 ? (
        <AppContainer sx={{ my: { xs: 3, md: 4 } }}>
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
          >
            {highlightedHeroListings.map((item: any) => (
              <SwiperSlide key={item?._id}>
                <Box
                  onClick={() => navigate(`/listing/${item?._id}`)}
                  sx={{
                    position: "relative",
                    height: { xs: 280, md: 420 },
                    cursor: "pointer",
                    overflow: "hidden",
                    borderRadius: "14px",
                    background: "#e2e8f0",
                  }}
                >
                  {getListingImage(item) ? (
                    <img
                      src={getListingImage(item)}
                      alt={item?.name || "listing"}
                      height="100%"
                      width="100%"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
                      height: "50%",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "18px",
                      zIndex: 1,
                    }}
                  >
                    {item?.name}
                  </Box>
                  {item?.status === "early_access" ? (
                    <Box
                      sx={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "999px",
                        padding: "3px 10px",
                        display: "inline-block",
                        position: "absolute",
                        top: 8,
                        left: 8,
                        zIndex: 1,
                        pointerEvents: "none",
                      }}
                    >
                      ⚡ Early Access
                    </Box>
                  ) : null}
                  {item?.studentAccommodation ? (
                    <Box
                      sx={{
                        ...studentAccommodationOverlayBadgeSx,
                        top: item?.status === "early_access" ? 36 : 8,
                      }}
                    >
                      🎓 Student Accommodation
                    </Box>
                  ) : null}
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </AppContainer>
      ) : null}

      <AppContainer>
        <Box
          sx={{
            my: { xs: 6, md: 8 },
          }}
        >
          <Swiper
            slidesPerView={1}
            spaceBetween={30}
            centeredSlides={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            modules={[Autoplay, Pagination]}
            speed={1500}
            effect="fade"
          >
            {groupedSlides?.length > 0 && !groupedByLocationError
              ? groupedSlides.map((group: any) => (
                  <SwiperSlide key={group?.location} style={Banner}>
                    <AppCard sx={{ width: "100%" }}>
                      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                        <Heading sx={{ color: "#475569", marginBottom: 1 }}>
                          {group?.location}
                        </Heading>
                        <Grid container spacing={2}>
                          {group?.listings?.map((item: any) => (
                            <Grid item xs={12} sm={6} md={4} key={item?._id}>
                              <Box
                                sx={{ cursor: "pointer" }}
                                onClick={() => {
                                  navigate(`/listing/${item?._id}`);
                                }}
                              >
                                <Box
                                  sx={{
                                    height: { xs: 140, sm: 160, md: 180 },
                                    overflow: "hidden",
                                    position: "relative",
                                    borderRadius: "12px",
                                    background: "#e2e8f0",
                                  }}
                                >
                                  {getListingImage(item) ? (
                                    <img
                                      src={getListingImage(item)}
                                      alt={item?.name || "listing"}
                                      height="100%"
                                      width="100%"
                                      style={{ objectFit: "cover" }}
                                    />
                                  ) : null}
                                  {item?.status === "early_access" ? (
                                    <Box
                                      sx={{
                                        background: "#dbeafe",
                                        color: "#1e40af",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        borderRadius: "999px",
                                        padding: "3px 10px",
                                        display: "inline-block",
                                        position: "absolute",
                                        top: 8,
                                        left: 8,
                                        zIndex: 1,
                                        pointerEvents: "none",
                                      }}
                                    >
                                      ⚡ Early Access
                                    </Box>
                                  ) : null}
                                  {item?.studentAccommodation ? (
                                    <Box
                                      sx={{
                                        ...studentAccommodationOverlayBadgeSx,
                                        top: item?.status === "early_access" ? 36 : 8,
                                      }}
                                    >
                                      🎓 Student Accommodation
                                    </Box>
                                  ) : null}
                                </Box>
                                <SubHeading
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    marginTop: 1,
                                  }}
                                >
                                  {item?.name}
                                </SubHeading>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </AppCard>
                  </SwiperSlide>
                ))
              : images?.map((image: any) => (
                  <SwiperSlide key={image} style={Banner}>
                    <Box sx={{ width: "100%", height: { xs: 260, sm: 360, md: 520 } }}>
                      <img
                        src={image}
                        alt="listing"
                        width="100%"
                        height="100%"
                        style={{ objectFit: "cover" }}
                        className="swiper-lazy"
                      />
                    </Box>
                  </SwiperSlide>
                ))}
          </Swiper>
        </Box>
      </AppContainer>

      <AppContainer>
        <Box
          sx={{
            marginBottom: "40px",
          }}
        >
        </Box>
      </AppContainer>
    </Box>
  );
};

export default Home;
