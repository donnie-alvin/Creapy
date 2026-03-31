// React Imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// Material UI Imports
import {
  Box,
  Avatar,
  IconButton,
  MenuItem,
  Menu,
  styled,
  MenuProps,
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
// Component Imports
import { Heading } from "../Heading";
import SearchBar from "../SearchBar";
import AppButton from "../ui/AppButton";
import AppContainer from "../ui/AppContainer";
// Hooks Imports
import useTypedSelector from "../../hooks/useTypedSelector";
// Redux Imports
import {
  selectedUserAvatar,
  selectedUserName,
  selectedUserRole,
  setUser,
} from "../../redux/auth/authSlice";
// Icons Imports
import { ImProfile } from "react-icons/im";
import { IoLogOutOutline } from "react-icons/io5";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import {
  selectedSearchText,
  setSearchText,
} from "../../redux/global/globalSlice";

const menuStyle = {
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
};

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(() => ({
  "& .MuiPaper-root": {
    borderRadius: 12,
    width: "100%",
    maxWidth: 260,
    background: "#fff",
    color: "#334155",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "10px 5px",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
      },
    },
  },
}));

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const avatar = useTypedSelector(selectedUserAvatar);
  const userName = useTypedSelector(selectedUserName);
  const userRole = useTypedSelector(selectedUserRole);
  const searchText = useTypedSelector(selectedSearchText);

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (event: any) => {
    let value = event.target.value.toLowerCase();
    dispatch(setSearchText(value));
    setSearchTerm(value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTextFromUrl = urlParams.get("searchTerm");
    if (searchTextFromUrl) {
      dispatch(setSearchText(searchTextFromUrl));
      setSearchTerm(searchTextFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  return (
    <header>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          background: "rgba(243, 246, 241, 0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
        }}
      >
        <AppContainer>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "72px",
              py: { xs: 1, md: 1.5 },
              gap: 2,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: { xs: "100%", md: "auto" },
              }}
            >
              <Box
                onClick={() => navigate("/")}
                sx={{ display: "flex", cursor: "pointer", alignItems: "center" }}
              >
                <Heading sx={{ color: "#2B6A50" }}>Real</Heading>
                <Heading sx={{ color: "#1F2937" }}>Estate</Heading>
              </Box>
              <IconButton
                sx={{
                  display: "flex",
                  "@media (min-width:768px)": {
                    display: "none",
                  },
                }}
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="toggle mobile navigation"
              >
                {mobileOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 320 }, maxWidth: { md: 480 } }}>
              <form onSubmit={handleSubmit}>
                <SearchBar
                  placeholder="Search locations, listings..."
                  searchText={searchText}
                  handleSearch={handleSearch}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </form>
            </Box>

            <Box
              sx={{
                display: "none",
                "@media (min-width:768px)": {
                  display: "flex",
                },
                alignItems: "center",
                gap: { xs: 1.5, md: 2 },
                flexWrap: "wrap",
                justifyContent: { xs: "center", md: "flex-end" },
              }}
            >
              <Box sx={menuStyle} onClick={() => navigate("/")}>
                Home
              </Box>
              <Box sx={menuStyle} onClick={() => navigate("/about")}>
                About
              </Box>
              <Box sx={menuStyle} onClick={() => navigate("/search")}>
                Properties
              </Box>

              {avatar ? (
                <>
                  <Box
                    sx={menuStyle}
                    onClick={() => {
                      if (userRole === "landlord") {
                        navigate("/dashboard/landlord");
                      } else if (userRole === "tenant") {
                        navigate("/dashboard/tenant");
                      } else if (userRole === "admin") {
                        navigate("/dashboard/admin");
                      } else {
                        navigate("/");
                      }
                    }}
                  >
                    Dashboard
                  </Box>
                  {userRole === "landlord" && (
                    <AppButton
                      variant="contained"
                      onClick={() => navigate("/create-listing")}
                    >
                      Create Listing
                    </AppButton>
                  )}
                  <Box sx={{ cursor: "pointer" }}>
                    <IconButton
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      color="inherit"
                    >
                      <Avatar alt="User Avatar" src={avatar} />
                    </IconButton>
                    <StyledMenu
                      onClick={() => setAnchorEl(null)}
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                    >
                      <MenuItem
                        sx={{
                          "&:hover": {
                            background: "unset",
                            cursor: "unset",
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <img
                            height={30}
                            width={30}
                            src={avatar}
                            alt="user"
                            style={{ borderRadius: "50%" }}
                          />
                          <Box>{userName}</Box>
                        </Box>
                      </MenuItem>
                      <MenuItem
                        sx={{
                          "&:hover": {
                            background: "unset",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            gap: "3px",
                            marginTop: "5px",
                          }}
                        >
                          <Tooltip title="See Profile" placement="bottom">
                            <Box
                              sx={{
                                background: "#eff1f7",
                                borderTopLeftRadius: "12px",
                                borderBottomLeftRadius: "12px",
                                width: "100%",
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                              onClick={() => {
                                navigate("/profile");
                              }}
                            >
                              <ImProfile />
                              Profile
                            </Box>
                          </Tooltip>
                          <Tooltip title="Logout Profile" placement="bottom">
                            <Box
                              sx={{
                                background: "#eff1f7",
                                borderTopRightRadius: "12px",
                                borderBottomRightRadius: "12px",
                                width: "100%",
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                              onClick={() => {
                                dispatch(setUser(null));
                                localStorage.removeItem("user");
                                setAnchorEl(null);
                                navigate("/");
                              }}
                            >
                              <IoLogOutOutline /> Logout
                            </Box>
                          </Tooltip>
                        </Box>
                      </MenuItem>
                    </StyledMenu>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={menuStyle} onClick={() => navigate("/login")}>
                    Log in
                  </Box>
                  <AppButton onClick={() => navigate("/signup")}>Sign up</AppButton>
                </>
              )}
            </Box>
          </Box>
        </AppContainer>
      </Box>
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 260, pt: 2, px: 2 } }}
      >
        <List>
          <ListItemButton
            onClick={() => {
              navigate("/");
              setMobileOpen(false);
            }}
          >
            <ListItemText primary="Home" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              navigate("/search");
              setMobileOpen(false);
            }}
          >
            <ListItemText primary="Search / Properties" />
          </ListItemButton>

          {avatar ? (
            <>
              <ListItemButton
                onClick={() => {
                  if (userRole === "landlord") {
                    navigate("/dashboard/landlord");
                  } else if (userRole === "tenant") {
                    navigate("/dashboard/tenant");
                  } else if (userRole === "admin") {
                    navigate("/dashboard/admin");
                  } else {
                    navigate("/");
                  }
                  setMobileOpen(false);
                }}
              >
                <ListItemText primary="Dashboard" />
              </ListItemButton>
              <ListItemButton
                onClick={() => {
                  navigate("/profile");
                  setMobileOpen(false);
                }}
              >
                <ListItemText primary="Profile" />
              </ListItemButton>
              <Divider sx={{ my: 1 }} />
              <ListItemButton
                onClick={() => {
                  dispatch(setUser(null));
                  localStorage.removeItem("user");
                  setMobileOpen(false);
                  navigate("/");
                }}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          ) : (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItemButton
                onClick={() => {
                  navigate("/login");
                  setMobileOpen(false);
                }}
              >
                <ListItemText primary="Login" />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>
    </header>
  );
};

export default Header;
