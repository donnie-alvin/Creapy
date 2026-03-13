// React Imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// MUI Imports
import {
  Box,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from "@mui/material";
// Custom Imports
import SearchBar from "../../components/SearchBar";
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppInput from "../../components/ui/AppInput";
import AppSelect from "../../components/ui/AppSelect";
import AppButton from "../../components/ui/AppButton";
import DotLoader from "../../components/Spinner/dotLoader";
import { ZIMBABWE_PROVINCES } from "../../config/zimbabweProvinces";
import { studentAccommodationBadgeSx } from "../../styles/listingBadges";
// Hooks Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import {
  selectedSearchText,
  setSearchText,
} from "../../redux/global/globalSlice";
// React Icons
import { FaLocationDot } from "react-icons/fa6";
import { FaBed } from "react-icons/fa";
import { FaBath } from "react-icons/fa";
// Utils Imports
import { getApiBaseUrl, thousandSeparatorNumber } from "../../utils";

const iconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#334155",
  fontWeight: "bold",
  fontSize: "13px",
};

const sortTypes = [
  {
    name: "Latest",
    value: "createdAt_desc",
  },
  {
    name: "Oldest",
    value: "createdAt_asc",
  },
  {
    name: "Price High to Low",
    value: "monthlyRent_desc",
  },
  {
    name: "Price Low to High",
    value: "monthlyRent_asc",
  },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchText = useTypedSelector(selectedSearchText);
  const token = JSON.parse(localStorage.getItem("user") || "null")?.token;
  const apiBase = getApiBaseUrl();

  const [sideBarData, setSideBarData] = useState<any>({
    searchTerm: "",
    location: "",
    minRent: "",
    maxRent: "",
    minTotalRooms: "",
    solar: false,
    borehole: false,
    security: false,
    internet: false,
    type: "all",
    parking: false,
    furnished: false,
    offer: false,
    studentAccommodation: false,
    sort: "createdAt_desc",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<any>([]);
  const [showMore, setShowMore] = useState(false);
  const locationSearch = window.location.search;

  const normalizeType = (value: string | null) => {
    if (value === "rent" || value === "all") {
      return value;
    }
    return "all";
  };

  const hasAnySupportedFilterParam = (urlParams: URLSearchParams) => {
    const supportedParams = [
      "searchTerm",
      "location",
      "minRent",
      "maxRent",
      "minTotalRooms",
      "minBedrooms",
      "solar",
      "borehole",
      "security",
      "internet",
      "type",
      "parking",
      "furnished",
      "offer",
      "studentAccommodation",
      "sort",
    ];

    return supportedParams.some((param) => urlParams.has(param));
  };

  const normalizeRoomParams = (urlParams: URLSearchParams) => {
    const minTotalRooms = urlParams.get("minTotalRooms");
    const minBedrooms = urlParams.get("minBedrooms");

    if (!minTotalRooms && minBedrooms) {
      urlParams.set("minTotalRooms", minBedrooms);
    }

    urlParams.delete("minBedrooms");
  };

  const handleSearch = (event: any) => {
    let value = event.target.value.toLowerCase();
    setSideBarData({ ...sideBarData, searchTerm: value });
    dispatch(setSearchText(value));
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(locationSearch);
    const searchTermFromUrl = urlParams.get("searchTerm");
    const typeFromUrl = urlParams.get("type");
    const parkingFromUrl = urlParams.get("parking");
    const furnishedFromUrl = urlParams.get("furnished");
    const offerFromUrl = urlParams.get("offer");
    const studentAccommodationFromUrl = urlParams.get("studentAccommodation");
    const sortFromUrl = urlParams.get("sort");
    const locationFromUrl = urlParams.get("location");
    const minRentFromUrl = urlParams.get("minRent");
    const maxRentFromUrl = urlParams.get("maxRent");
    const minTotalRoomsFromUrl = urlParams.get("minTotalRooms");
    const minBedroomsFromUrl = urlParams.get("minBedrooms");
    const solarFromUrl = urlParams.get("solar");
    const boreholeFromUrl = urlParams.get("borehole");
    const securityFromUrl = urlParams.get("security");
    const internetFromUrl = urlParams.get("internet");
    const normalizedType = normalizeType(typeFromUrl);

    if (hasAnySupportedFilterParam(urlParams)) {
      setSideBarData({
        searchTerm: searchTermFromUrl || "",
        location: locationFromUrl || "",
        minRent: minRentFromUrl || "",
        maxRent: maxRentFromUrl || "",
        minTotalRooms: minTotalRoomsFromUrl || minBedroomsFromUrl || "",
        solar: solarFromUrl === "true",
        borehole: boreholeFromUrl === "true",
        security: securityFromUrl === "true",
        internet: internetFromUrl === "true",
        type: normalizedType,
        parking: parkingFromUrl === "true" ? true : false,
        furnished: furnishedFromUrl === "true" ? true : false,
        offer: offerFromUrl === "true" ? true : false,
        studentAccommodation: studentAccommodationFromUrl === "true",
        sort: sortFromUrl || "createdAt_desc",
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      if (typeFromUrl && normalizedType !== typeFromUrl) {
        urlParams.set("type", normalizedType);
      }
      normalizeRoomParams(urlParams);
      const searchQuery = urlParams.toString();
      const res = await fetch(`${apiBase}/listings/get?${searchQuery}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data?.data?.length > 5) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(data?.data);
      setLoading(false);
    };

    fetchListings();
  }, [locationSearch, token]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set("searchTerm", sideBarData.searchTerm);
    urlParams.set("type", normalizeType(sideBarData.type));
    urlParams.set("parking", sideBarData.parking);
    urlParams.set("furnished", sideBarData.furnished);
    urlParams.set("offer", sideBarData.offer);
    urlParams.set("studentAccommodation", sideBarData.studentAccommodation);
    urlParams.set("sort", sideBarData.sort);
    urlParams.set("location", sideBarData.location);
    urlParams.set("minRent", sideBarData.minRent);
    urlParams.set("maxRent", sideBarData.maxRent);
    urlParams.set("minTotalRooms", sideBarData.minTotalRooms);
    urlParams.set("solar", sideBarData.solar);
    urlParams.set("borehole", sideBarData.borehole);
    urlParams.set("security", sideBarData.security);
    urlParams.set("internet", sideBarData.internet);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    normalizeRoomParams(urlParams);
    urlParams.set("page", (page + 1).toString());
    const searchQuery = urlParams.toString();
    const res = await fetch(`${apiBase}/listings/get?${searchQuery}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = await res.json();
    if (data?.data?.length < 6) {
      setShowMore(false);
    }
    setListings([...listings, ...data?.data]);
  };

  return (
    <Box sx={{ mt: { xs: 4, md: 4.5 } }}>
      <AppContainer>
      {loading && (
        <Box sx={{ position: "relative", minHeight: 40 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              inset: 0,
            }}
          >
            <DotLoader color="#334155" />
          </Box>
        </Box>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <Heading sx={{ margin: "0 0 10px 0" }}>Filters</Heading>
          <AppCard sx={{ p: { xs: 2, md: 2.5 } }}>
            <form onSubmit={handleSubmit}>
              <SubHeading sx={{ marginBottom: "8px" }}>Search</SubHeading>
              <SearchBar
                placeholder="Search..."
                searchText={searchText}
                handleSearch={handleSearch}
                value={sideBarData.searchTerm}
                onChange={handleSearch}
                color="#fff"
              />

              <Box sx={{ marginTop: "10px" }}>
                <SubHeading sx={{ marginBottom: "5px" }}>Province</SubHeading>
                <AppSelect
                  options={[
                    { label: "All Provinces", value: "" },
                    ...ZIMBABWE_PROVINCES,
                  ]}
                  value={sideBarData.location}
                  onChange={(e) =>
                    setSideBarData({ ...sideBarData, location: e.target.value })
                  }
                  size="small"
                  displayEmpty
                  renderValue={(selected) => {
                    const province = selected as string;
                    return province || "All Provinces";
                  }}
                />
              </Box>

              <Box sx={{ marginTop: "10px" }}>
                <SubHeading sx={{ marginBottom: "5px" }}>Rent Range</SubHeading>
                <Grid container spacing={1} sx={{ marginTop: "0px" }}>
                  <Grid item xs={6}>
                    <AppInput
                      value={sideBarData.minRent}
                      size="small"
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, minRent: e.target.value })
                      }
                      placeholder="Min"
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <AppInput
                      value={sideBarData.maxRent}
                      size="small"
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, maxRent: e.target.value })
                      }
                      placeholder="Max"
                      type="number"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ marginTop: "10px" }}>
                <SubHeading sx={{ marginBottom: "5px" }}>Min Rooms</SubHeading>
                <AppInput
                  value={sideBarData.minTotalRooms}
                  size="small"
                  onChange={(e) =>
                    setSideBarData({ ...sideBarData, minTotalRooms: e.target.value })
                  }
                  placeholder="e.g., 2"
                  type="number"
                />
              </Box>

              <Box sx={{ marginTop: "10px" }}>
                <SubHeading sx={{ marginBottom: "5px" }}>Amenities</SubHeading>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sideBarData.solar}
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, solar: e.target.checked })
                      }
                    />
                  }
                  label="Solar"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sideBarData.borehole}
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, borehole: e.target.checked })
                      }
                    />
                  }
                  label="Borehole"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sideBarData.security}
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, security: e.target.checked })
                      }
                    />
                  }
                  label="Security"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sideBarData.internet}
                      onChange={(e) =>
                        setSideBarData({ ...sideBarData, internet: e.target.checked })
                      }
                    />
                  }
                  label="Internet"
                />
              </Box>
              <Box sx={{ marginTop: "10px" }}>
                <RadioGroup
                  name="type"
                  value={sideBarData.type}
                  onChange={(event) => {
                    setSideBarData({
                      ...sideBarData,
                      type: event.target.value,
                    });
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label="All Listings"
                    />
                    <FormControlLabel
                      value="rent"
                      control={<Radio />}
                      label="Rent"
                    />
                  </Box>
                </RadioGroup>
              </Box>
              <Box sx={{ margin: "0 0 5px 0" }}>
                <FormControlLabel
                  control={<Checkbox />}
                  label="Offer"
                  name="offer"
                  checked={sideBarData.offer}
                  onChange={() => {
                    setSideBarData({
                      ...sideBarData,
                      offer: !sideBarData.offer,
                    });
                  }}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Parking"
                  name="parking"
                  checked={sideBarData.parking}
                  onChange={() => {
                    setSideBarData({
                      ...sideBarData,
                      parking: !sideBarData.parking,
                    });
                  }}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Furnished"
                  name="furnished"
                  checked={sideBarData.furnished}
                  onChange={() => {
                    setSideBarData({
                      ...sideBarData,
                      furnished: !sideBarData.furnished,
                    });
                  }}
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Student Accommodation"
                  name="studentAccommodation"
                  checked={sideBarData.studentAccommodation}
                  onChange={() => {
                    setSideBarData({
                      ...sideBarData,
                      studentAccommodation: !sideBarData.studentAccommodation,
                    });
                  }}
                />
              </Box>
              <SubHeading sx={{ margin: "5px 0" }}>Sort</SubHeading>
              <AppSelect
                name="sort"
                value={sideBarData.sort}
                onChange={(event: any) => {
                  setSideBarData({
                    ...sideBarData,
                    sort: event.target.value,
                  });
                }}
                options={sortTypes.map((copyType) => ({
                  value: copyType.value,
                  label: copyType.name,
                }))}
              />
              <AppButton sx={{ width: "100%", marginTop: "16px" }} type="submit">
                Search
              </AppButton>
            </form>
          </AppCard>
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <Box>
            <Heading sx={{ margin: "0 0 5px 0" }}>Listing Results</Heading>
            <Grid container spacing={2}>
              {!loading && listings?.length === 0 ? (
                <Grid item xs={12}>
                  <AppCard sx={{ p: 3, textAlign: "center" }}>
                    No results found
                  </AppCard>
                </Grid>
              ) : (
                <>
                  {listings?.map((item: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <AppCard
                        sx={{ cursor: "pointer" }}
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
                              minHeight: { xs: "auto", md: "44px" },
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
                            / month
                            <Box>
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
                            </Box>
                          </Box>
                          {item?.studentAccommodation ? (
                            <Box sx={{ ...studentAccommodationBadgeSx, mt: 1 }}>
                              🎓 Student Accommodation
                            </Box>
                          ) : null}
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
                                {item?.totalRooms ?? item?.bedrooms} Rooms
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
                </>
              )}
            </Grid>
            {showMore && (
              <AppButton onClick={onShowMoreClick} sx={{ marginTop: 2 }}>
                Show More
              </AppButton>
            )}
          </Box>
        </Grid>
      </Grid>
      </AppContainer>
    </Box>
  );
};

export default SearchPage;
