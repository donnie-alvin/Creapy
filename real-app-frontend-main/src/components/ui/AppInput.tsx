import { TextField, TextFieldProps } from "@mui/material";

const AppInput = (props: TextFieldProps) => {
  return <TextField fullWidth size={props.size || "medium"} {...props} />;
};

export default AppInput;
