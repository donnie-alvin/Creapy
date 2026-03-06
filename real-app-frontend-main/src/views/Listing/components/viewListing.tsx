// React Imports
import { useParams } from "react-router-dom";
// MUI Imports
import { Box, Grid, Divider } from "@mui/material";
// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css/bundle";
// Component Imports
import OverlayLoader from "../../../components/Spinner/OverlayLoader";
import { Heading, SubHeading } from "../../../components/Heading";
import AppContainer from "../../../components/ui/AppContainer";
import AppCard from "../../../components/ui/AppCard";
// Utils Imports
import { maskingPhoneNumber, thousandSeparatorNumber } from "../../../utils";
// React Icons
import { FaLocationDot } from "react-icons/fa6";
import { FaBath } from "react-icons/fa";
import { FaParking } from "react-icons/fa";
import { FaChair } from "react-icons/fa6";
import { FaBed } from "react-icons/fa";
import { IoIosCall } from "react-icons/io";
import { HiOutlineMail } from "react-icons/hi";
import { IoMdPerson } from "react-icons/io";
// Redux Imports
import { useGetUserQuery } from "../../../redux/api/userApiSlice";
import { useGetSingleListingQuery } from "../../../redux/api/listingApiSlice";

const iconStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#15803d",
  fontWeight: "bold",
};

const ViewListing = () => {
  const { id } = useParams();
  SwiperCore.use([Navigation]);

  const { data, isLoading } = useGetSingleListingQuery(id as string, {
    skip: !id,
  });
  const images = data?.data?.imageUrls;

  // User API Query
  const { data: userData, isLoading: isUserLoading } = useGetUserQuery(
    id as string,
    {
      skip: !id,
    }
  );

  if (!id) return <div>Missing listing id</div>;

  return (
    <>
      {(isLoading || isUserLoading) && <OverlayLoader />}
      <Box>
        <Swiper navigation={true}>
          {images?.map((image: any) => (
            <SwiperSlide key={image}>
              <Box sx={{ height: { xs: 260, sm: 360, md: 520 } }}>
                <img
                  src={image}
                  alt="listing"
                  width="100%"
                  height="100%"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
        <AppContainer>
          <Box sx={{ margin: "30px 0" }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8} lg={8}>
                <AppCard sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Heading>{`${data?.data?.name} - USD ${thousandSeparatorNumber(
                    data?.data?.monthlyRent || data?.data?.regularPrice
                  )}/`}</Heading>
                  <Box
                    sx={{
                      marginTop: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    <FaLocationDot style={{ color: "#2B6A50" }} />
                    {data?.data?.address}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      margin: "14px 0",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        background: "#1F4D3A",
                        color: "#fff",
                        borderRadius: "999px",
                        padding: "6px 14px",
                        display: "inline-flex",
                        alignItems: "center",
                        fontWeight: 600,
                      }}
                    >
                      {data?.data?.type === "rent" ? "Rent" : "Sale"}
                    </Box>
                    {data?.data?.discountedPrice > 0 && (
                      <>
                        <Box
                          sx={{
                            background: "#1F2937",
                            color: "#fff",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          USD {thousandSeparatorNumber(data?.data?.discountedPrice)} discount
                        </Box>
                        <Box
                          sx={{
                            background: "#6B8A7A",
                            color: "#fff",
                            borderRadius: "999px",
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          Now USD{" "}
                          {thousandSeparatorNumber(
                            (data?.data?.monthlyRent || data?.data?.regularPrice) -
                              data?.data?.discountedPrice
                          )}
                          /
                        </Box>
                      </>
                    )}
                    {data?.data?.status === "early_access" ? (
                      <Box
                        sx={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "999px",
                          padding: "3px 10px",
                          display: "inline-block",
                        }}
                      >
                        ⚡ Early Access
                      </Box>
                    ) : null}
                  </Box>
                  {data?.data?.status === "early_access" ? (
                    <Box
                      sx={{
                        fontSize: "13px",
                        color: "#1e40af",
                        marginTop: 1,
                      }}
                    >
                      {data?.data?.earlyAccessUntil &&
                      new Date(data.data.earlyAccessUntil) > new Date()
                        ? `This listing is available exclusively to Premium members for the next ${Math.ceil(
                            (new Date(data.data.earlyAccessUntil).getTime() -
                              Date.now()) /
                              3_600_000
                          )} hours.`
                        : "This listing is in Early Access."}
                    </Box>
                  ) : null}

                  <Box sx={{ marginTop: 1 }}>
                    <SubHeading>Description</SubHeading>
                    <Box sx={{ color: "text.secondary", marginTop: 0.5 }}>
                      {data?.data?.description}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      marginTop: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box sx={iconStyle}>
                      <FaBed style={{ color: "#2B6A50" }} />
                      {data?.data?.bedrooms} Rooms
                    </Box>
                    <Box sx={iconStyle}>
                      <FaBath style={{ color: "#2B6A50" }} />
                      {data?.data?.bathrooms} Baths
                    </Box>
                    <Box sx={iconStyle}>
                      <FaParking style={{ color: "#2B6A50" }} />
                      {data?.data?.amenities?.parking ? "Parking" : "No Parking"}
                    </Box>
                    <Box sx={iconStyle}>
                      <FaChair style={{ color: "#2B6A50" }} />
                      {data?.data?.furnished ? "Furnished" : "Not Furnished"}
                    </Box>
                  </Box>
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4} lg={4}>
                <AppCard sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Heading
                    sx={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    Owner Details
                  </Heading>
                  <Divider />
                  <Box
                    sx={{
                      margin: "15px 0 10px 0",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      rowGap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: { xs: "80px", sm: "100px" },
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <IoMdPerson /> Name
                    </Box>
                    <Box>{userData?.data?.username}</Box>
                  </Box>
                  <Box
                    sx={{
                      margin: "15px 0 10px 0",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      rowGap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: { xs: "80px", sm: "100px" },
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <HiOutlineMail /> Email
                    </Box>
                    <Box>{userData?.data?.email}</Box>
                  </Box>
                  <Box
                    sx={{
                      margin: "15px 0 10px 0",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      rowGap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: { xs: "80px", sm: "100px" },
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <IoIosCall /> Phone
                    </Box>
                    <Box>{maskingPhoneNumber(data?.data?.phoneNumber)}</Box>
                  </Box>
                </AppCard>
              </Grid>
            </Grid>
          </Box>
        </AppContainer>
      </Box>
    </>
  );
};

export default ViewListing;
