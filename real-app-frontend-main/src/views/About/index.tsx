// MUI Imports
import { Box } from "@mui/material";
// Custom Imports
import { Heading, SubHeading } from "../../components/Heading";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";

const About = () => {
  return (
    <Box sx={{ margin: "65px 0 0 0" }}>
      <AppContainer>
        <Heading>About RealEstate</Heading>
        <AppCard sx={{ marginTop: "20px", p: { xs: 2, md: 3 } }}>
        <Box sx={{ color: "#334155", fontSize: "16px", lineHeight: 1.7 }}>
  This platform is an agent-free rental housing marketplace built to connect
  tenants and landlords directly — no middlemen, no inflated fees, no wasted
  time.
  <br />
  <br />
  In many rental markets, agents slow things down, reduce transparency, and
  increase costs for tenants while limiting landlords’ control over their own
  listings. This platform exists to remove that friction entirely by offering a
  simple, digital way to discover and list rental properties based on real,
  structured data.
  <br />
  <br />
  Tenants can browse public listings without creating an account, filter homes
  by location, price, rooms, and amenities, and view clear property details
  including room breakdowns and available features such as solar power,
  boreholes, security, parking, and internet availability.
  <br />
  <br />
  Landlords list and manage their properties directly, keeping full ownership
  of their listings while reaching tenants faster and more efficiently.
  <br />
  <br />
  The platform follows a landlord-paid publishing model. Basic access —
  browsing listings, viewing property details, and contacting landlords — is
  always free for everyone. Tenants never pay, while landlords subscribe only
  when they want to publish listings.
  <br />
  <br />
  Built as a mobile-first web application, the goal is speed, clarity, and trust
  — making it easier to find a home or rent one out without unnecessary
  intermediaries.
</Box>

        </AppCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "50px 0 75px 0",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          <AppCard
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              width: { xs: "100%", sm: "260px", md: "300px" },
              p: 2,
            }}
          >
            <Box sx={{ width: { xs: "64px", sm: "72px" }, height: { xs: "64px", sm: "72px" } }}>
              <img
                src="https://firebasestorage.googleapis.com/v0/b/real-estate-54ca1.appspot.com/o/1701424117897salman%20passport.jpg?alt=media&token=a903aba6-b78e-4442-b0c0-f07c0dfa145f"
                alt="salman"
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            </Box>
            <SubHeading sx={{ marginTop: "10px" }}>Salman Muazam</SubHeading>
            <Box>0323 4910955</Box>
            <Heading sx={{ fontSize: "14px", marginTop: "10px" }}>CEO</Heading>
          </AppCard>
          <AppCard
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              width: { xs: "100%", sm: "260px", md: "300px" },
              p: 2,
            }}
          >
            <Box sx={{ width: { xs: "64px", sm: "72px" }, height: { xs: "64px", sm: "72px" } }}>
              <img
                src="https://firebasestorage.googleapis.com/v0/b/real-estate-54ca1.appspot.com/o/1701198186809Hassan.jpg?alt=media&token=881f2f1b-b0d4-4933-9b4a-79259d313f42"
                alt="hassan"
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            </Box>
            <SubHeading sx={{ marginTop: "10px" }}>Hassan Raza</SubHeading>
            <Box>0300 0315440</Box>
            <Heading sx={{ fontSize: "14px", marginTop: "10px" }}>
              President
            </Heading>
          </AppCard>
          <AppCard
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              width: { xs: "100%", sm: "260px", md: "300px" },
              p: 2,
            }}
          >
            <Box sx={{ width: { xs: "64px", sm: "72px" }, height: { xs: "64px", sm: "72px" } }}>
              <img
                src="https://firebasestorage.googleapis.com/v0/b/real-estate-54ca1.appspot.com/o/1701198124445Faizan.jpg?alt=media&token=560ccfc3-f5f4-430c-b55d-d6a0357c7be2"
                alt="salman"
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            </Box>
            <SubHeading sx={{ marginTop: "10px" }}>Ch Faizan</SubHeading>
            <Box>0355 5032437</Box>
            <Heading sx={{ fontSize: "14px", marginTop: "10px" }}>
              Marketing Manager
            </Heading>
          </AppCard>
        </Box>
      </AppContainer>
    </Box>
  );
};

export default About;
