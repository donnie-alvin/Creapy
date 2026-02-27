import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1F4D3A",
      dark: "#163A2C",
      light: "#2B6A50",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#6B8A7A",
    },
    background: {
      default: "#F3F6F1",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F2937",
      secondary: "#4B5563",
    },
    divider: "#E5E7EB",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Manrope, \"Segoe UI\", Tahoma, Arial, sans-serif",
    h1: { fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontSize: "1.75rem", fontWeight: 700 },
    h4: { fontSize: "1.5rem", fontWeight: 700 },
    h5: { fontSize: "1.25rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.7 },
    body2: { fontSize: "0.9rem", lineHeight: 1.6 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shadows: [
    "none",
    "0px 2px 8px rgba(15, 23, 42, 0.06)",
    "0px 6px 16px rgba(15, 23, 42, 0.08)",
    "0px 10px 24px rgba(15, 23, 42, 0.10)",
    "0px 14px 32px rgba(15, 23, 42, 0.12)",
    "0px 18px 40px rgba(15, 23, 42, 0.14)",
    "0px 22px 48px rgba(15, 23, 42, 0.16)",
    "0px 26px 56px rgba(15, 23, 42, 0.18)",
    "0px 30px 64px rgba(15, 23, 42, 0.20)",
    "0px 34px 72px rgba(15, 23, 42, 0.22)",
    "0px 38px 80px rgba(15, 23, 42, 0.24)",
    "0px 42px 88px rgba(15, 23, 42, 0.26)",
    "0px 46px 96px rgba(15, 23, 42, 0.28)",
    "0px 50px 104px rgba(15, 23, 42, 0.30)",
    "0px 54px 112px rgba(15, 23, 42, 0.32)",
    "0px 58px 120px rgba(15, 23, 42, 0.34)",
    "0px 62px 128px rgba(15, 23, 42, 0.36)",
    "0px 66px 136px rgba(15, 23, 42, 0.38)",
    "0px 70px 144px rgba(15, 23, 42, 0.40)",
    "0px 74px 152px rgba(15, 23, 42, 0.42)",
    "0px 78px 160px rgba(15, 23, 42, 0.44)",
    "0px 82px 168px rgba(15, 23, 42, 0.46)",
    "0px 86px 176px rgba(15, 23, 42, 0.48)",
    "0px 90px 184px rgba(15, 23, 42, 0.50)",
    "0px 94px 192px rgba(15, 23, 42, 0.52)",
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0px 10px 30px rgba(15, 23, 42, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: "10px 18px",
          lineHeight: 1.2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: "#FFFFFF",
          minHeight: 48,
        },
        notchedOutline: {
          borderColor: "#E5E7EB",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#64748B",
        },
      },
    },
  },
});

export default theme;
