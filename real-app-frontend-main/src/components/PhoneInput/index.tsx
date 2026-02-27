import "react-phone-input-2/lib/material.css";
import PhoneInput from "react-phone-input-2";
import { removeDashAndSpace } from "../../utils";
import { useEffect, useState } from "react";
import axios from "axios";
import { FormHelperText } from "@mui/material";

interface PhoneNumberProps {
  value: string;
  name: string;
  onChange?: any;
  countryCode?: string;
  variant?: "standard" | "outlined" | "filled";
  label?: string;
  formik?: any;
  authScreens?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  showErrorMessage?: boolean;
}

const PrimaryPhoneInput = ({
  value,
  name,
  onChange,
  countryCode,
  variant,
  label,
  formik,
  authScreens,
  disabled,
  readOnly,
  showErrorMessage,
}: PhoneNumberProps) => {
  const [defaultCountry, setDefaultCountry] = useState<any>("zw");

  const [loader, setLoader] = useState(false);

  const options = {
    method: "GET",
    url: "https://geolocation-db.com/json/67273a00-5c4b-11ed-9204-d161c2da74ce",
  };

  const getCountry = async () => {
    try {
      setLoader(true);
      const response = await axios.request(options);

      if (response?.data?.country_code !== "Not found") {
        setLoader(false);
        setDefaultCountry(response?.data?.country_code.toLowerCase());
      } else {
        setLoader(false);
        setDefaultCountry("zw");
      }
    } catch (error) {
      setLoader(false);
      setDefaultCountry("zw");
      console.warn(error);
    }
  };

  useEffect(() => {
    if (authScreens) {
      getCountry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PhoneInput
        country={
          (countryCode ? countryCode.toLowerCase() : defaultCountry || "zw") as any
        }
        value={value}
        onChange={(val: string) => {
          const cleaned = removeDashAndSpace(val);
          onChange ? onChange(cleaned) : formik?.setFieldValue(name, cleaned);
        }}
        inputProps={{
          name,
          readOnly,
          disabled,
          onBlur: formik?.handleBlur,
        }}
        specialLabel={label || ""}
        disabled={disabled}
        disableDropdown={loader || disabled}
        // Keep styling close to the previous MUI input height
        inputStyle={{ width: "100%", minHeight: "48px" }}
        containerStyle={{ width: "100%" }}
      />

      {formik?.touched?.[name] && Boolean(formik?.errors?.[name]) && !showErrorMessage ? (
        <FormHelperText error sx={{ marginLeft: 0 }}>
          {formik?.errors?.[name]}
        </FormHelperText>
      ) : null}
    </>
  );
};

export default PrimaryPhoneInput;
