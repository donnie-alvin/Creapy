import { Container, ContainerProps } from "@mui/material";

const AppContainer = (props: ContainerProps) => {
  return <Container maxWidth={props.maxWidth || "lg"} {...props} />;
};

export default AppContainer;
