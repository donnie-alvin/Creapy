import { Button, ButtonProps } from "@mui/material";

const AppButton = (props: ButtonProps) => {
  return <Button variant={props.variant || "contained"} {...props} />;
};

export default AppButton;
