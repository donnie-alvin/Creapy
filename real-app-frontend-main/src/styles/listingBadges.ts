import { Theme } from "@mui/material/styles";
import { SxProps } from "@mui/system";

export const studentAccommodationBadgeSx: SxProps<Theme> = {
  background: "#ede9fe",
  color: "#5b21b6",
  borderRadius: "999px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 700,
  display: "inline-block",
};

export const studentAccommodationOverlayBadgeSx: SxProps<Theme> = {
  ...studentAccommodationBadgeSx,
  padding: "3px 10px",
  fontSize: "11px",
  position: "absolute",
  left: 8,
  zIndex: 1,
  pointerEvents: "none",
};
