// React Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// MUI Imports
import { Box, Grid } from "@mui/material";
// Redux Imports
import {
  useDeleteListingMutation,
  useGetListingQuery,
} from "../../../redux/api/listingApiSlice";
import { selectedUserId } from "../../../redux/auth/authSlice";
// Hook Imports
import useTypedSelector from "../../../hooks/useTypedSelector";
// React Icons
import { CiEdit } from "react-icons/ci";
import { MdDeleteOutline } from "react-icons/md";
// Utils Imports
import { convertToFormattedDate } from "../../../utils";
// Component Imports
import { Heading } from "../../../components/Heading";
import OverlayLoader from "../../../components/Spinner/OverlayLoader";
import ToastAlert from "../../../components/ToastAlert/ToastAlert";
import DotLoader from "../../../components/Spinner/dotLoader";
import AppContainer from "../../../components/ui/AppContainer";
import AppCard from "../../../components/ui/AppCard";
import AppButton from "../../../components/ui/AppButton";

const AllListings = () => {
  const navigate = useNavigate();
  const userId = useTypedSelector(selectedUserId);

  const [selectedListing, setSelectedListing] = useState<any>({});
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  const { data, isLoading, isSuccess } = useGetListingQuery(userId);

  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const DeleteListingHandler = async (id: string) => {
    try {
      const listing: any = await deleteListing(id);
      if (listing?.data === null) {
        setToast({
          ...toast,
          message: "Listing Deleted Successfully",
          appearence: true,
          type: "success",
        });
      }
      if (listing?.error) {
        setToast({
          ...toast,
          message: listing?.error?.message,
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Delete Listing Error", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ marginTop: "50px" }}>
      {isLoading && <OverlayLoader />}
      <AppContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Heading>Your Listings</Heading>
        </Box>
          {isSuccess && data?.data?.length === 0 ? (
            <AppCard
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "20px",
                margin: "20px 0",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              No Listings to show
              <AppButton
                onClick={() => {
                  navigate("/create-listing");
                }}
                sx={{ margin: "10px 0 0" }}
              >
                Create Listing
              </AppButton>
            </AppCard>
          ) : (
            <>
              {data?.data?.map((item: any) => {
                return (
                  <AppCard
                    sx={{
                      width: "100%",
                      padding: "20px",
                      margin: "20px 0",
                    }}
                    key={item?._id}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexDirection: { xs: "column", sm: "row" },
                      }}
                    >
                      <Grid item xs={12} sm={3} md={2}>
                        <img
                          src={item?.imageUrls[0]}
                          width="100%"
                          height={140}
                          alt="listing"
                          style={{ borderRadius: "5px" }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={9} md={10}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            minHeight: { xs: "auto", sm: "110px" },
                            flexDirection: { xs: "column", sm: "row" },
                          }}
                        >
                          <Box sx={{ width: "100%" }}>
                            <Box
                              sx={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#49454F",
                                "&:hover": {
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => {
                                navigate(`/listing/${item?._id}`);
                              }}
                            >
                              {item?.name}
                            </Box>
                            <Box
                              sx={{
                                color: "#1e293b",
                                marginTop: "8px",
                              }}
                            >
                              {item?.description?.length > 125
                                ? item?.description?.substring(0, 125) + "..."
                                : item?.description}
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              width: { xs: "100%", sm: "auto" },
                            }}
                          >
                            <AppButton
                              variant="outlined"
                              color="error"
                              startIcon={
                                selectedListing === item?._id &&
                                isDeleting ? null : (
                                  <MdDeleteOutline />
                                )
                              }
                              disabled={isDeleting}
                              onClick={() => {
                                DeleteListingHandler(item?._id);
                                setSelectedListing(item?._id);
                              }}
                            >
                              {selectedListing === item?._id && isDeleting ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: "7px",
                                    height: "20px",
                                  }}
                                >
                                  <DotLoader color="#f44336" size={12} />
                                </Box>
                              ) : (
                                "Delete"
                              )}
                            </AppButton>

                            <AppButton
                              variant="outlined"
                              color="success"
                              startIcon={<CiEdit />}
                              onClick={() => {
                                navigate(`/listings/${item?._id}`);
                              }}
                            >
                              Edit
                            </AppButton>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: { xs: "flex-start", sm: "end" },
                            gap: 1,
                            marginTop: "5px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box>Date:</Box>
                          <Box sx={{ fontWeight: 600 }}>
                            {convertToFormattedDate(item?.createdAt)}
                          </Box>
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
                          </Box>{" "}
                        </Box>
                      </Grid>
                    </Box>
                  </AppCard>
                );
              })}
            </>
          )}
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

export default AllListings;
