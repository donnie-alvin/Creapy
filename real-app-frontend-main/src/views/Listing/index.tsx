// React Imports
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parsePhoneNumberFromString } from "libphonenumber-js";
// Formik Imports
import { Form, Formik, FormikProps } from "formik";
// MUI Imports
import {
  Box,
  FormControlLabel,
  RadioGroup,
  Checkbox,
  Radio,
} from "@mui/material";
// Utils Imports
import { buildUploadSignUrl, onKeyDown } from "../../utils";
// Redux Imports
import {
  useCreateListingMutation,
  useGetSingleListingQuery,
  useUpdateListingMutation,
} from "../../redux/api/listingApiSlice";
import {
  selectedUserId,
  selectedUserRole,
} from "../../redux/auth/authSlice";
// Hooks Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Custom Imports
import { Heading, SubHeading } from "../../components/Heading";
import PrimaryInput from "../../components/PrimaryInput/PrimaryInput";
import { listingSchema } from "./components/validationSchema";
import DotLoader from "../../components/Spinner/dotLoader";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
import PrimaryPhoneInput from "../../components/PhoneInput";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import { ZIMBABWE_PROVINCES } from "../../config/zimbabweProvinces";
import AppSelect from "../../components/ui/AppSelect";

interface listingForm {
  name: string;
  phoneNumber: string;
  description: string;
  address: string;
  location: {
    province: string;
    city: string;
    addressLine: string;
    country: string;
  };
  regularPrice: number;
  discountedPrice: number;
  bathrooms: number;
  bedrooms: number | "";
  totalRooms: number | "";
  furnished: boolean;
  type: string;
  offer: boolean;
  studentAccommodation: boolean;
  amenities: {
    solar: boolean;
    borehole: boolean;
    security: boolean;
    parking: boolean;
    internet: boolean;
  };
  files?: null | any[];
}

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = useTypedSelector(selectedUserId);
  const userRole = useTypedSelector(selectedUserRole);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formValues, setFormValues] = useState<listingForm>({
    name: "",
    phoneNumber: "263",
    description: "",
    address: "",
    location: {
      province: "",
      city: "",
      addressLine: "",
      country: "Zimbabwe",
    },
    regularPrice: 25000,
    discountedPrice: 0,
    bathrooms: 1,
    bedrooms: "",
    totalRooms: 1,
    furnished: false,
    offer: false,
    studentAccommodation: false,
    type: "rent",
    amenities: {
      solar: false,
      borehole: false,
      security: false,
      parking: false,
      internet: false,
    },
    files: [],
  });
  const [listingImages, setListingImages] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<boolean | string>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  const UploadHandler = () => {
    if (listingImages.length === 0)
      return setImageError("Please select an image");

    if (listingImages.length + imageUrls.length < 7) {
      setImageLoading(true);
      const promises = [];
      for (let i = 0; i < listingImages.length; i++) {
        promises.push(UploadImage(listingImages[i]));
      }

      Promise.all(promises)
        .then((urls: any) => {
          // add more urls to previous ones
          setImageUrls([...imageUrls, ...urls]);
          setImageError(false);
          setImageLoading(false);
        })
        .catch((error) => {
          console.log(error);
          setImageError("Image Upload Failed (2 mb max per image)");
          setImageLoading(false);
        });
    } else {
      setImageError("You can upload only 6 images per listing");
    }
  };

  const UploadImage = async (image: File) => {
    // get token from auth blob (it exists)
    const token = JSON.parse(localStorage.getItem("user") || "null")?.token;

    // 1) Ask backend for signed URL
    const res = await fetch(buildUploadSignUrl(image.type, "listings"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Failed to get signed URL");

    const { uploadUrl, publicUrl } = json.data;

    // 2) Upload directly to R2
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": image.type },
      body: image,
    });

    if (!putRes.ok) throw new Error("R2 upload failed");

    // 3) Return the public URL (same thing your DB already stores)
    return publicUrl as string;
  };

  // Create Listing API bind
  const [createListing, { isLoading }] = useCreateListingMutation();
  // Update Listing API bind
  const [updateListing, { isLoading: updatingLoading }] =
    useUpdateListingMutation();

  const resolveUserId = () => {
    if (userId) return userId;
    try {
      const authBlob = JSON.parse(localStorage.getItem("user") || "null");
      return (
        authBlob?.data?.user?._id ||
        authBlob?.user?._id ||
        authBlob?._id ||
        null
      );
    } catch (error) {
      console.error("Failed to parse auth blob:", error);
      return null;
    }
  };

  const listingHandler = async (data: listingForm) => {

    const resolvedUserId = resolveUserId();

    if (!resolvedUserId) {
      setToast({
        ...toast,
        message: "Session expired. Please log in again.",
        appearence: true,
        type: "error",
      });
      return;
    }

    const rawPhoneNumber = (data.phoneNumber || "").trim();
    const phoneWithPlus = rawPhoneNumber.startsWith("+")
      ? rawPhoneNumber
      : rawPhoneNumber.startsWith("263")
      ? `+${rawPhoneNumber}`
      : `+263${rawPhoneNumber}`;
    const parsedPhone = parsePhoneNumberFromString(phoneWithPlus);

    if (!parsedPhone || !parsedPhone.isValid()) {
      setToast({
        ...toast,
        message: "Please provide a valid contact number",
        appearence: true,
        type: "error",
      });
      return;
    }

    const payload = {
      name: data.name?.trim(),
      description: data.description?.trim(),
      address: data.address?.trim(),
      // Backwards compat: server maps regularPrice -> monthlyRent
      regularPrice: Number(data.regularPrice),
      monthlyRent: Number(data.regularPrice),
      location: {
        addressLine: data.address?.trim() || "",
        country: "Zimbabwe",
        province: data.location.province?.trim(),
        city: data.location.city?.trim() || "",
      },
      amenities: data.amenities,
      discountedPrice: data.offer ? Number(data.discountedPrice || 0) : 0,
      bathrooms: Number(data.bathrooms),
      bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
      totalRooms: Number(data.totalRooms),
      furnished: data.furnished,
      type: data.type,
      offer: data.offer,
      studentAccommodation: data.studentAccommodation,
      phoneNumber: parsedPhone.number,
      imageUrls,
      user: resolvedUserId,
      userRef: resolvedUserId,
    };
    try {
      if (imageUrls.length < 2)
        return setImageError("Please upload at least 2 image");

      // Update Listing
      if (id) {
        const updatedListing: any = await updateListing({ id, payload });
        if (updatedListing?.data?.status) {
          setToast({
            ...toast,
            message: "Listing Updated Successfully",
            appearence: true,
            type: "success",
          });
          navigate("/listings");
        }
        if (updatedListing?.error) {
          setToast({
            ...toast,
            message: updatedListing?.error?.data?.message,
            appearence: true,
            type: "error",
          });
        }
        return;
      }
      // Create Listing
      const listing: any = await createListing(payload);
      if (listing?.data?.status) {
        setToast({
          ...toast,
          message: "Listing Created Successfully",
          appearence: true,
          type: "success",
        });
        const newListingId =
          listing?.data?.data?.listing?._id ||
          listing?.data?.data?._id ||
          listing?.data?._id;
        if (!newListingId) {
          setToast({
            ...toast,
            message: "Could not determine listing ID. Please try again.",
            appearence: true,
            type: "error",
          });
          return;
        }
        navigate("/dashboard/landlord");
      }
      if (listing?.error) {
        setToast({
          ...toast,
          message: listing?.error?.data?.message,
          appearence: true,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Create Listing Error:", error);
      setToast({
        ...toast,
        message: "Something went wrong",
        appearence: true,
        type: "error",
      });
    }
  };

  // Get Single Listing API query
  const {
    data: listingData,
    isLoading: listingLoading,
    isSuccess: listingSuccess,
  } = useGetSingleListingQuery(id as string, { skip: !id });

  useEffect(() => {
    if (id && listingSuccess) {
      const rawLocation = listingData?.data?.location;
      const normalizedLocation =
        rawLocation && typeof rawLocation === "object"
          ? {
              province: rawLocation.province || "",
              city: rawLocation.city || "",
              addressLine:
                rawLocation.addressLine || listingData?.data?.address || "",
              country: rawLocation.country || "Zimbabwe",
            }
          : {
              province: rawLocation || "",
              city: "",
              addressLine: listingData?.data?.address || "",
              country: "Zimbabwe",
            };

      setFormValues({
        name: listingData?.data?.name,
        description: listingData?.data?.description,
        address: listingData?.data?.address,
        location: normalizedLocation,
        regularPrice: listingData?.data?.regularPrice || listingData?.data?.monthlyRent,
        discountedPrice: listingData?.data?.discountedPrice,
        bathrooms: listingData?.data?.bathrooms,
        bedrooms: listingData?.data?.bedrooms ?? "",
        totalRooms: listingData?.data?.totalRooms ?? 1,
        furnished: listingData?.data?.furnished,
        type: listingData?.data?.type,
        offer: listingData?.data?.offer,
        studentAccommodation: listingData?.data?.studentAccommodation ?? false,
        phoneNumber: listingData?.data?.phoneNumber,
        amenities: listingData?.data?.amenities || {
          solar: false,
          borehole: false,
          security: false,
          parking: false,
          internet: false,
        },
      });
      setImageUrls(listingData?.data?.imageUrls);
    }
  }, [listingData, listingSuccess]);

  return (
    <Box sx={{ mt: { xs: 5, md: 6 } }}>
      {listingLoading && <OverlayLoader />}
      <AppContainer>
        <Box sx={{ textAlign: "center" }}>
          <Heading>{id ? "Update" : "Create"} a Listing</Heading>
        </Box>
        <AppCard sx={{ my: { xs: 3, md: 4 }, p: { xs: 2, md: 3 } }}>
          <Formik
            initialValues={formValues}
            onSubmit={(values: listingForm) => {
              listingHandler(values);
            }}
            validationSchema={listingSchema}
            enableReinitialize
          >
            {(props: FormikProps<listingForm>) => {
              const {
                values,
                touched,
                errors,
                handleBlur,
                handleChange,
                setFieldValue,
              } = props;

              return (
                <Form onKeyDown={onKeyDown} style={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                      <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <Box
                          sx={{
                            minHeight:
                              errors.name && touched.name ? "80px" : "72px",
                          }}
                        >
                          <SubHeading sx={{ marginBottom: "5px" }}>
                            Name
                          </SubHeading>
                          <PrimaryInput
                            type="text"
                            label=""
                            name="name"
                            placeholder="Name"
                            value={values.name}
                            helperText={
                              errors.name && touched.name ? errors.name : ""
                            }
                            error={errors.name && touched.name ? true : false}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </Box>
                        <Box>
                          <SubHeading sx={{ marginBottom: "5px" }}>
                            Description
                          </SubHeading>
                          <PrimaryInput
                            type="text"
                            label=""
                            name="description"
                            placeholder="Description"
                            multiline={true}
                            minRows={3}
                            value={values.description}
                            helperText={
                              errors.description && touched.description
                                ? errors.description
                                : ""
                            }
                            error={
                              errors.description && touched.description
                                ? true
                                : false
                            }
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            gap: 1,
                            flexDirection: { xs: "column", sm: "row" },
                          }}
                        >
                          <Box
                            sx={{
                              minHeight: "72px",
                              marginTop:
                                errors.description && touched.description
                                  ? "0"
                                  : "15px",
                              width: { xs: "100%", sm: "50%" },
                            }}
                          >
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Address
                            </SubHeading>
                            <PrimaryInput
                              type="text"
                              label=""
                              name="address"
                              placeholder="Address"
                              value={values.address}
                              helperText={
                                errors.address && touched.address
                                  ? errors.address
                                  : ""
                              }
                              error={
                                errors.address && touched.address ? true : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                          <Box
                            sx={{
                              width: { xs: "100%", sm: "50%" },
                            }}
                          >
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Contact Number
                            </SubHeading>

                            <PrimaryPhoneInput
                              value={values.phoneNumber}
                              name="phoneNumber"
                              formik={props}
                              variant="outlined"
                              label=""
                            />
                          </Box>
                        </Box>
                        <Box sx={{ width: "100%", marginTop: "10px" }}>
                          <SubHeading sx={{ marginBottom: "5px" }}>
                            Province
                          </SubHeading>
                          <AppSelect
                            name="location.province"
                            value={values.location.province}
                            options={[
                              {
                                label: "Select a province",
                                value: "",
                              },
                              ...ZIMBABWE_PROVINCES,
                            ]}
                            displayEmpty
                            onChange={(e: any) =>
                              setFieldValue("location.province", e.target.value)
                            }
                            onBlur={handleBlur}
                            renderValue={(selected) => {
                              const province = selected as string;
                              return province || "Select a province";
                            }}
                            error={
                              Boolean(
                                touched.location &&
                                  typeof errors.location === "object" &&
                                  errors.location?.province
                              )
                            }
                          />
                          {touched.location &&
                          typeof errors.location === "object" &&
                          errors.location?.province ? (
                            <Box
                              sx={{
                                color: "#d32f2f",
                                fontSize: "0.75rem",
                                marginTop: "3px",
                                marginLeft: "14px",
                              }}
                            >
                              {errors.location.province as string}
                            </Box>
                          ) : null}
                        </Box>
                        <Box sx={{ width: "100%", marginTop: "10px" }}>
                          <SubHeading sx={{ marginBottom: "5px" }}>
                            City / Area
                          </SubHeading>
                          <PrimaryInput
                            type="text"
                            label=""
                            name="location.city"
                            placeholder="City / Area"
                            value={values.location.city}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            width: "100%",
                            marginTop:
                              errors.address && touched.address ? "10px" : "",
                            flexDirection: { xs: "column", sm: "row" },
                          }}
                        >
                          <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Total Rooms *
                            </SubHeading>
                            <PrimaryInput
                              type="number"
                              label=""
                              name="totalRooms"
                              placeholder="e.g. 4"
                              value={values.totalRooms}
                              helperText={
                                errors.totalRooms && touched.totalRooms
                                  ? errors.totalRooms
                                  : "Enter the total number of rooms in the property."
                              }
                              error={
                                errors.totalRooms && touched.totalRooms
                                  ? true
                                  : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                          <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Bedrooms (optional)
                            </SubHeading>
                            <PrimaryInput
                              type="number"
                              label=""
                              name="bedrooms"
                              placeholder="e.g. 2"
                              value={values.bedrooms}
                              helperText={
                                errors.bedrooms && touched.bedrooms
                                  ? errors.bedrooms
                                  : "Leave blank if the property does not have a separate bedroom count."
                              }
                              error={
                                errors.bedrooms && touched.bedrooms
                                  ? true
                                  : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                          <Box sx={{ width: "100%" }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Baths
                            </SubHeading>
                            <PrimaryInput
                              type="number"
                              label=""
                              name="bathrooms"
                              placeholder="Baths"
                              value={values.bathrooms}
                              helperText={
                                errors.bathrooms && touched.bathrooms
                                  ? errors.bathrooms
                                  : ""
                              }
                              error={
                                errors.bathrooms && touched.bathrooms
                                  ? true
                                  : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            width: "100%",
                            marginTop: "10px",
                            flexDirection: { xs: "column", sm: "row" },
                          }}
                        >
                          <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Regular Price{" "}
                              {values.type === "Rent" ? (
                                <span
                                  style={{
                                    marginLeft: "5px",
                                    fontSize: "12px",
                                  }}
                                >
                                  (USD / Month)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    marginLeft: "5px",
                                    fontSize: "12px",
                                  }}
                                >
                                  (USD)
                                </span>
                              )}
                            </SubHeading>
                            <PrimaryInput
                              type="number"
                              label=""
                              name="regularPrice"
                              placeholder="Regular Price"
                              value={values.regularPrice}
                              helperText={
                                errors.regularPrice && touched.regularPrice
                                  ? errors.regularPrice
                                  : ""
                              }
                              error={
                                errors.regularPrice && touched.regularPrice
                                  ? true
                                  : false
                              }
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Box>
                          {values.offer && (
                            <Box sx={{ width: { xs: "100%", sm: "50%" } }}>
                              <SubHeading sx={{ marginBottom: "5px" }}>
                                Discounted Price
                              </SubHeading>

                              <PrimaryInput
                                type="number"
                                label=""
                                name="discountedPrice"
                                placeholder="Discounted Price"
                                value={values.discountedPrice}
                                helperText={
                                  errors.discountedPrice &&
                                  touched.discountedPrice
                                    ? errors.discountedPrice
                                    : ""
                                }
                                error={
                                  errors.discountedPrice &&
                                  touched.discountedPrice
                                    ? true
                                    : false
                                }
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ marginTop: "7px" }}>
                          <RadioGroup
                            name="type"
                            value={values.type}
                            onChange={handleChange}
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
                                value="rent"
                                control={<Radio />}
                                label="Rent"
                              />
                            </Box>
                          </RadioGroup>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <FormControlLabel
                              control={<Checkbox />}
                              label="Furnished"
                              name="furnished"
                              checked={values.furnished}
                              onChange={handleChange}
                            />
                            <FormControlLabel
                              control={<Checkbox />}
                              label="Offer"
                              name="offer"
                              checked={values.offer}
                              onChange={handleChange}
                            />
                            <FormControlLabel
                              control={<Checkbox />}
                              label="Student Accommodation"
                              name="studentAccommodation"
                              checked={values.studentAccommodation}
                              onChange={handleChange}
                            />
                          </Box>
                          <Box sx={{ marginTop: "10px" }}>
                            <SubHeading sx={{ marginBottom: "5px" }}>
                              Amenities
                            </SubHeading>
                            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                              <FormControlLabel
                                control={<Checkbox />}
                                label="Solar"
                                name="amenities.solar"
                                checked={values.amenities.solar}
                                onChange={handleChange}
                              />
                              <FormControlLabel
                                control={<Checkbox />}
                                label="Borehole"
                                name="amenities.borehole"
                                checked={values.amenities.borehole}
                                onChange={handleChange}
                              />
                              <FormControlLabel
                                control={<Checkbox />}
                                label="Security"
                                name="amenities.security"
                                checked={values.amenities.security}
                                onChange={handleChange}
                              />
                              <FormControlLabel
                                control={<Checkbox />}
                                label="Parking"
                                name="amenities.parking"
                                checked={values.amenities.parking}
                                onChange={handleChange}
                              />
                              <FormControlLabel
                                control={<Checkbox />}
                                label="Internet"
                                name="amenities.internet"
                                checked={values.amenities.internet}
                                onChange={handleChange}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <Box sx={{ marginTop: "25px" }}>
                          <SubHeading sx={{ marginBottom: "10px" }}>
                            Images :
                            <span
                              style={{
                                marginLeft: "5px",
                                color: "#4b5563",
                                fontWeight: "normal",
                              }}
                            >
                              The first image will be the cover (max 6)
                            </span>
                          </SubHeading>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 2,
                              flexDirection: { xs: "column", sm: "row" },
                            }}
                          >
                            <Box
                              sx={{
                                border: "1px solid #ccc",
                                padding: "10px",
                                borderRadius: "5px",
                                width: "100%",
                              }}
                            >
                              <input
                                type="file"
                                name="files"
                                onChange={(event) => {
                                  const fileList: any =
                                    event.currentTarget.files;
                                  const fileArray = Array.from(fileList);
                                  setFieldValue("files", fileArray);
                                  setListingImages(fileArray);
                                  if (imageUrls.length < 3) {
                                    if (fileArray.length === 0) {
                                      setImageError("Please select an image");
                                    } else {
                                      setImageError("");
                                    }
                                  }
                                }}
                                multiple
                                accept="image/*"
                              />
                            </Box>
                            <AppButton
                              variant="outlined"
                              color="success"
                              sx={{
                                textTransform: "capitalize",
                                width: { xs: "100%", sm: "120px" },
                              }}
                              onClick={UploadHandler}
                              disabled={imageLoading}
                            >
                              {imageLoading ? (
                                <DotLoader color="#334155" size={12} />
                              ) : (
                                "Upload"
                              )}
                            </AppButton>
                          </Box>
                          {touched.files && errors.files && (
                            <Box
                              sx={{
                                fontSize: "12px",
                                color: "#d32f2f",
                                marginTop: "5px",
                              }}
                            >
                              {errors.files}
                            </Box>
                          )}
                          <Box
                            sx={{
                              fontSize: "12px",
                              color: "#d32f2f",
                              marginTop: "5px",
                            }}
                          >
                            {imageError}
                          </Box>
                          {imageUrls.length > 0 &&
                            imageUrls.map((url, index) => (
                              <Box
                                sx={{
                                  margin: "15px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  border: "1px solid #ccc",
                                  padding: "10px",
                                  borderRadius: "5px",
                                  gap: 2,
                                  flexDirection: { xs: "column", sm: "row" },
                                }}
                                key={index}
                              >
                                <Box
                                  sx={{
                                    width: { xs: "100%", sm: "220px" },
                                    height: { xs: "140px", sm: "100px" },
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt="listing"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Box>
                                <AppButton
                                  variant="outlined"
                                  color="error"
                                  sx={{
                                    textTransform: "capitalize",
                                    border: "none",
                                    "&:hover": {
                                      border: "none",
                                    },
                                  }}
                                  onClick={() => {
                                    const newUrls = imageUrls.filter(
                                      (imageUrl) => imageUrl !== url
                                    );
                                    setImageUrls(newUrls);
                                  }}
                                >
                                  Delete
                                </AppButton>
                              </Box>
                            ))}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              marginTop: "20px",
                            }}
                          >
                            <AppButton
                              type="submit"
                              fullWidth
                              disabled={isLoading || updatingLoading}
                              sx={{ margin: "0 0 20px 0" }}
                            >
                              {isLoading || updatingLoading ? (
                                <DotLoader color="#fff" size={12} />
                              ) : (
                                <>{id ? "Update Listing" : "Create Listing"}</>
                              )}
                            </AppButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                </Form>
              );
            }}
          </Formik>
        </AppCard>
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

export default CreateListing;
