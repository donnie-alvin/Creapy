import { useMemo, useState } from "react";
import { Box, Grid, FormControlLabel, Checkbox } from "@mui/material";

import { Heading, SubHeading } from "../../components/Heading";
import useTypedSelector from "../../hooks/useTypedSelector";
import { selectedUserRole } from "../../redux/auth/authSlice";
import {
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useGetMySavedSearchesQuery,
} from "../../redux/api/userApiSlice";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";

const SavedSearches = () => {
  const role = useTypedSelector(selectedUserRole);

  const { data: searchesData, refetch } = useGetMySavedSearchesQuery(undefined, {
    skip: role !== "tenant",
  });

  const [createSavedSearch, { isLoading: creating }] =
    useCreateSavedSearchMutation();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();

  const searches = useMemo(() => searchesData?.data || [], [searchesData]);

  const [form, setForm] = useState<any>({
    name: "My Saved Search",
    location: "",
    minRent: "",
    maxRent: "",
    minBedrooms: "",
    amenities: {
      solar: false,
      borehole: false,
      security: false,
      parking: false,
      internet: false,
    },
  });

  const submit = async () => {
    const payload = {
      name: form.name,
      criteria: {
        location: form.location,
        minRent: Number(form.minRent || 0),
        maxRent: Number(form.maxRent || 0),
        minBedrooms: Number(form.minBedrooms || 0),
        amenities: form.amenities,
      },
    };

    await createSavedSearch(payload);
    await refetch();
  };

  if (role !== "tenant") {
    return (
      <Box sx={{ marginTop: "50px" }}>
        <AppContainer>
          <Heading>Saved Searches</Heading>
          <AppCard sx={{ marginTop: "10px", p: 2 }}>
            Only tenant accounts can use saved searches.
          </AppCard>
        </AppContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ marginTop: "50px" }}>
      <AppContainer>
        <Heading>Saved Searches</Heading>

        <AppCard sx={{ marginTop: "20px", p: 2 }}>
          <SubHeading sx={{ marginBottom: "10px" }}>Create</SubHeading>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <AppInput
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AppInput
                label="Location / Area"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <AppInput
                label="Min Rent"
                type="number"
                value={form.minRent}
                onChange={(e) => setForm({ ...form, minRent: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <AppInput
                label="Max Rent"
                type="number"
                value={form.maxRent}
                onChange={(e) => setForm({ ...form, maxRent: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <AppInput
                label="Min Beds"
                type="number"
                value={form.minBedrooms}
                onChange={(e) => setForm({ ...form, minBedrooms: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={10}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                <FormControlLabel
                  control={<Checkbox checked={form.amenities.solar} />}
                  label="Solar"
                  onChange={(e: any) =>
                    setForm({
                      ...form,
                      amenities: { ...form.amenities, solar: e.target.checked },
                    })
                  }
                />
                <FormControlLabel
                  control={<Checkbox checked={form.amenities.borehole} />}
                  label="Borehole"
                  onChange={(e: any) =>
                    setForm({
                      ...form,
                      amenities: { ...form.amenities, borehole: e.target.checked },
                    })
                  }
                />
                <FormControlLabel
                  control={<Checkbox checked={form.amenities.security} />}
                  label="Security"
                  onChange={(e: any) =>
                    setForm({
                      ...form,
                      amenities: { ...form.amenities, security: e.target.checked },
                    })
                  }
                />
                <FormControlLabel
                  control={<Checkbox checked={form.amenities.parking} />}
                  label="Parking"
                  onChange={(e: any) =>
                    setForm({
                      ...form,
                      amenities: { ...form.amenities, parking: e.target.checked },
                    })
                  }
                />
                <FormControlLabel
                  control={<Checkbox checked={form.amenities.internet} />}
                  label="Internet"
                  onChange={(e: any) =>
                    setForm({
                      ...form,
                      amenities: { ...form.amenities, internet: e.target.checked },
                    })
                  }
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <AppButton onClick={submit} disabled={creating}>
                Save Search
              </AppButton>
            </Grid>
          </Grid>
        </AppCard>

        <AppCard sx={{ marginTop: "20px", p: 2 }}>
          <SubHeading sx={{ marginBottom: "10px" }}>Your Saved Searches</SubHeading>
          {searches.length === 0 ? (
            <Box>No saved searches yet.</Box>
          ) : (
            searches.map((s: any) => (
              <Box
                key={s._id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Box>
                  <Box sx={{ fontWeight: 600 }}>{s.name}</Box>
                  <Box sx={{ fontSize: "13px", color: "#475569" }}>
                    {s.criteria?.location ? `Loc: ${s.criteria.location} · ` : ""}
                    {s.criteria?.minRent ? `Min: ${s.criteria.minRent} · ` : ""}
                    {s.criteria?.maxRent ? `Max: ${s.criteria.maxRent} · ` : ""}
                    {s.criteria?.minBedrooms ? `Beds: ${s.criteria.minBedrooms}` : ""}
                  </Box>
                </Box>
                <AppButton
                  variant="outlined"
                  onClick={async () => {
                    await deleteSavedSearch(s._id);
                    await refetch();
                  }}
                >
                  Delete
                </AppButton>
              </Box>
            ))
          )}
        </AppCard>
      </AppContainer>
    </Box>
  );
};

export default SavedSearches;
