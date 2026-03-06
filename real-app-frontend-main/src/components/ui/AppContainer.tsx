import { Container, ContainerProps } from "@mui/material";

const AppContainer = (props: ContainerProps) => {
  const { sx, maxWidth, ...restProps } = props;

  return (
    <Container
      maxWidth={maxWidth || "lg"}
      sx={[{ px: { xs: 2, md: 4 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...restProps}
    />
  );
};

export default AppContainer;
