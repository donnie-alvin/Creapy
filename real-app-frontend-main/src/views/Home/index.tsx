// MUI Imports
import { Box, Grid } from "@mui/material";
// React Imports
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Custom Imports
import { Heading, SubHeading } from "../../components/Heading";
// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css/free-mode";
import "swiper/css";
// React Icons
import { PiShootingStarThin } from "react-icons/pi";
import {
  useGetHomeGroupedByLocationQuery,
  useGetHomeHighlightedQuery,
  useSearchListingsQuery,
} from "../../redux/api/listingApiSlice";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
// React Icons
import { FaLocationDot } from "react-icons/fa6";
import { FaBed } from "react-icons/fa";
import { FaBath } from "react-icons/fa";
import { thousandSeparatorNumber } from "../../utils";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";

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

const iconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#334155",
  fontWeight: "bold",
  fontSize: "13px",
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

  const offerString = "offer=true&limit=4";
  const rentString = "type=rent&limit=4";
  const saleString = "type=sale&limit=4";

  const { data: offerData, isLoading: offerLoading } =
    useSearchListingsQuery(offerString);

  const { data: rentData, isLoading: rentLoading } =
    useSearchListingsQuery(rentString);

  const { data: saleData, isLoading: saleLoading } =
    useSearchListingsQuery(saleString);
  const { data: highlightedData, isLoading: highlightedLoading } =
    useGetHomeHighlightedQuery(9);
  const {
    data: groupedByLocationData,
    isLoading: groupedByLocationLoading,
    isError: groupedByLocationError,
  } = useGetHomeGroupedByLocationQuery({ locationsLimit: 6, perLocation: 6 });

  // Keep top home cards driven by highlighted endpoint while preserving
  // legacy offer data as a graceful fallback.
  const highlightedListings =
    highlightedData?.data?.length > 0 ? highlightedData?.data : offerData?.data || [];

  const groupedSlides = useMemo(
    () => groupedByLocationData?.data || [],
    [groupedByLocationData?.data]
  );

  const getListingImage = (item: any) =>
    item?.image || item?.images?.[0] || item?.imageUrls?.[0] || null;

  // Never block the whole landing page forever.
  // If the API is down or DB isn't connected, show the page and allow retry.
  const [showOverlay, setShowOverlay] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const anyLoading =
      offerLoading ||
      rentLoading ||
      saleLoading ||
      highlightedLoading ||
      groupedByLocationLoading;
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
  }, [offerLoading, rentLoading, saleLoading, highlightedLoading, groupedByLocationLoading]);

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
        margin: "60px 0 0 0",
        "@media (max-width: 992px)": {
          margin: "40px 0 0 0",
        },
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
      <AppContainer>
        <Box
          sx={{
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            minHeight: { xs: "420px", md: "520px" },
            backgroundImage:
              "url(https://images.unsplash.com/photo-1505691723518-36a5ac3be353?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0px 18px 40px rgba(15, 23, 42, 0.15)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(110deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.25) 60%, rgba(15, 23, 42, 0.15) 100%)",
            }}
          />
          <Box
            sx={{
              position: "relative",
              padding: { xs: 3, md: 6 },
              maxWidth: { md: "60%" },
              color: "#fff",
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                background: "rgba(255,255,255,0.15)",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <PiShootingStarThin size={16} /> Premium listings
            </Box>
            <Heading sx={{ fontSize: { xs: "32px", md: "44px" }, marginTop: 2 }}>
              Build Your Future, One Property at a Time.
            </Heading>
            <SubHeading sx={{ marginTop: 1, color: "rgba(255,255,255,0.85)" }}>
              Discover curated homes, flexible rentals, and exclusive offers in the best
              neighborhoods.
            </SubHeading>
            <Box component="form" onSubmit={handleHeroSubmit} sx={{ marginTop: 3 }}>
              <AppCard
                sx={{
                  p: 2,
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
                <AppButton type="submit">Search Properties</AppButton>
              </AppCard>
            </Box>
          </Box>
        </Box>
      </AppContainer>

      <AppContainer>
        <Box
          sx={{
            margin: "70px 0",
            "@media (max-width: 600px)": {
              margin: "50px 0",
            },
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
                      <Box sx={{ padding: "18px 16px" }}>
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
                                </Box>
                                <SubHeading
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    color: "#abffe8",
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
            marginBottom: "100px",
            "@media (max-width: 600px)": {
              marginBottom: "10px",
            },
          }}
        >
          <Heading sx={{ color: "#475569" }}>Recent Offer</Heading>
          <Box
            sx={{
              color: "#1e40af",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => {
              navigate(`/search?offer=true`);
            }}
          >
            Show more offers
          </Box>
          <Box sx={{ margin: "15px 0" }}>
            <Grid container spacing={2}>
              {highlightedListings?.map((item: any, index: number) => (
                <Grid item xs={12} md={4} key={index}>
                  <AppCard
                    sx={{ marginBottom: "20px", cursor: "pointer" }}
                    onClick={() => {
                      navigate(`/listing/${item._id}`);
                    }}
                  >
                        <Box
                          sx={{
                            height: { xs: 180, md: 200 },
                            overflow: "hidden",
                            position: "relative",
                            "&:hover img": {
                              transform: "scale(1.1)",
                            },
                          }}
                        >
                        <img
                          src={item?.imageUrls[0]}
                          alt="listing"
                          height="100%"
                          width="100%"
                          style={{
                            objectFit: "cover",
                            borderRadius: "12px 12px 0 0",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </Box>
                      <Box sx={{ padding: "18px 16px" }}>
                        <SubHeading
                          sx={{
                            fontWeight: 600,
                            fontSize: "18px",
                            color: "#1f2937",
                          }}
                        >
                          {item?.name?.length > 30
                            ? item?.name?.substring(0, 30) + "..."
                            : item?.name}
                        </SubHeading>
                        <Box
                          sx={{
                            marginTop: "5px",
                            color: "text.secondary",
                            fontSize: "13px",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FaLocationDot style={{ color: "#15803d" }} />
                          {item?.address}
                        </Box>
                        <Box
                          sx={{
                            marginTop: "5px",
                            color: "text.secondary",
                            fontSize: "13px",
                            minHeight: "44px",
                          }}
                        >
                          {item?.description?.length > 150
                            ? item?.description?.substring(0, 150) + "..."
                            : item?.description}
                        </Box>
                        <Box
                          sx={{
                            color: "text.primary",
                            fontWeight: 600,
                            fontSize: "16px",
                            marginTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "5px",
                          }}
                        >
                          USD{" "}
                          {thousandSeparatorNumber(
                            item?.discountedPrice != null
                              ? (item?.monthlyRent || item?.regularPrice) -
                                  item?.discountedPrice
                              : item?.monthlyRent || item?.regularPrice
                          )}{" "}
                          {item?.type === "rent" ? "/ month" : ""}
                          <Box>
                            {item?.type === "rent" ? (
                              <Box
                                sx={{
                                  background: "#2B6A50",
                                  fontSize: "12px",
                                  color: "#fff",
                                  borderRadius: "999px",
                                  padding: "6px 12px",
                                  display: "inline-block",
                                }}
                              >
                                Rent
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  background: "#6B8A7A",
                                  fontSize: "12px",
                                  color: "#fff",
                                  borderRadius: "999px",
                                  padding: "6px 12px",
                                  display: "inline-block",
                                }}
                              >
                                Sale
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            marginTop: "7px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Box sx={iconStyle}>
                              <FaBed
                                style={{ color: "#334155", marginTop: "3px" }}
                              />
                              {item?.bedrooms} Beds
                            </Box>
                            <Box sx={iconStyle}>
                              <FaBath
                                style={{ color: "#334155", marginTop: "3px" }}
                              />
                              {item?.bathrooms} Baths
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </AppCard>
                </Grid>
              ))}
            </Grid>
          </Box>
          {/* Rent Data */}
          <Heading sx={{ color: "#475569", marginTop: "20px" }}>
            Places for Rent
          </Heading>
          <Box
            sx={{
              color: "#1e40af",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => {
              navigate(`/search?type=rent`);
            }}
          >
            Show more offers for rent
          </Box>
          <Box sx={{ margin: "15px 0" }}>
            <Grid container spacing={2}>
              {rentData?.data?.map((item: any, index: number) => (
                <Grid item xs={12} md={4} key={index}>
                  <AppCard
                    sx={{ marginBottom: "20px", cursor: "pointer" }}
                    onClick={() => {
                      navigate(`/listing/${item._id}`);
                    }}
                  >
                    <Box
                      sx={{
                        height: { xs: 180, md: 200 },
                        overflow: "hidden",
                        position: "relative",
                        "&:hover img": {
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <img
                        src={item?.imageUrls[0]}
                        alt="listing"
                        height="100%"
                        width="100%"
                        style={{
                          objectFit: "cover",
                          borderRadius: "12px 12px 0 0",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                    <Box sx={{ padding: "18px 16px" }}>
                      <SubHeading
                        sx={{
                          fontWeight: 600,
                          fontSize: "18px",
                          color: "#1f2937",
                        }}
                      >
                        {item?.name?.length > 30
                          ? item?.name?.substring(0, 30) + "..."
                          : item?.name}
                      </SubHeading>
                      <Box
                        sx={{
                          marginTop: "5px",
                          color: "text.secondary",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <FaLocationDot style={{ color: "#15803d" }} />
                        {item?.address}
                      </Box>
                      <Box
                        sx={{
                          marginTop: "5px",
                          color: "text.secondary",
                          fontSize: "13px",
                          minHeight: "44px",
                        }}
                      >
                        {item?.description?.length > 150
                          ? item?.description?.substring(0, 150) + "..."
                          : item?.description}
                      </Box>
                      <Box
                        sx={{
                          color: "text.primary",
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "5px",
                        }}
                      >
                        USD {thousandSeparatorNumber(item?.monthlyRent || item?.regularPrice)}{" "}
                        {item?.type === "rent" ? "/ month" : ""}
                        <Box>
                          {item?.type === "rent" ? (
                            <Box
                              sx={{
                                background: "#2B6A50",
                                fontSize: "12px",
                                color: "#fff",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                display: "inline-block",
                              }}
                            >
                              Rent
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                background: "#6B8A7A",
                                fontSize: "12px",
                                color: "#fff",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                display: "inline-block",
                              }}
                            >
                              Sale
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          marginTop: "7px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Box sx={iconStyle}>
                            <FaBed
                              style={{ color: "#334155", marginTop: "3px" }}
                            />
                            {item?.bedrooms} Beds
                          </Box>
                          <Box sx={iconStyle}>
                            <FaBath
                              style={{ color: "#334155", marginTop: "3px" }}
                            />
                            {item?.bathrooms} Baths
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </AppCard>
                </Grid>
              ))}
            </Grid>
          </Box>
          {/* Sale Data */}
          <Heading sx={{ color: "#475569", marginTop: "20px" }}>
            Places for Sale
          </Heading>
          <Box
            sx={{
              color: "#1e40af",
              fontSize: "13px",
              fontWeight: 400,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => {
              navigate(`/search?type=sale`);
            }}
          >
            Show more offers for sale
          </Box>
          <Box sx={{ margin: "15px 0" }}>
            <Grid container spacing={2}>
              {saleData?.data?.map((item: any, index: number) => (
                <Grid item xs={12} md={4} key={index}>
                  <AppCard
                    sx={{ marginBottom: "20px", cursor: "pointer" }}
                    onClick={() => {
                      navigate(`/listing/${item._id}`);
                    }}
                  >
                    <Box
                      sx={{
                        height: { xs: 180, md: 200 },
                        overflow: "hidden",
                        position: "relative",
                        "&:hover img": {
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <img
                        src={item?.imageUrls[0]}
                        alt="listing"
                        height="100%"
                        width="100%"
                        style={{
                          objectFit: "cover",
                          borderRadius: "12px 12px 0 0",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                    <Box sx={{ padding: "18px 16px" }}>
                      <SubHeading
                        sx={{
                          fontWeight: 600,
                          fontSize: "18px",
                          color: "#1f2937",
                        }}
                      >
                        {item?.name?.length > 30
                          ? item?.name?.substring(0, 30) + "..."
                          : item?.name}
                      </SubHeading>
                      <Box
                        sx={{
                          marginTop: "5px",
                          color: "text.secondary",
                          fontSize: "13px",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <FaLocationDot style={{ color: "#15803d" }} />
                        {item?.address}
                      </Box>
                      <Box
                        sx={{
                          marginTop: "5px",
                          color: "text.secondary",
                          fontSize: "13px",
                          minHeight: "44px",
                        }}
                      >
                        {item?.description?.length > 150
                          ? item?.description?.substring(0, 150) + "..."
                          : item?.description}
                      </Box>
                      <Box
                        sx={{
                          color: "text.primary",
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "5px",
                        }}
                      >
                        USD {thousandSeparatorNumber(item?.monthlyRent || item?.regularPrice)}{" "}
                        {item?.type === "rent" ? "/ month" : ""}
                        <Box>
                          {item?.type === "rent" ? (
                            <Box
                              sx={{
                                background: "#2B6A50",
                                fontSize: "12px",
                                color: "#fff",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                display: "inline-block",
                              }}
                            >
                              Rent
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                background: "#6B8A7A",
                                fontSize: "12px",
                                color: "#fff",
                                borderRadius: "999px",
                                padding: "6px 12px",
                                display: "inline-block",
                              }}
                            >
                              Sale
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          marginTop: "7px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Box sx={iconStyle}>
                            <FaBed
                              style={{ color: "#334155", marginTop: "3px" }}
                            />
                            {item?.bedrooms} Beds
                          </Box>
                          <Box sx={iconStyle}>
                            <FaBath
                              style={{ color: "#334155", marginTop: "3px" }}
                            />
                            {item?.bathrooms} Baths
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </AppCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </AppContainer>
    </Box>
  );
};

export default Home;
