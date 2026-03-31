import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  CircularProgress,
} from "@mui/material";
import AppContainer from "../../components/ui/AppContainer";
import AppCard from "../../components/ui/AppCard";
import AppButton from "../../components/ui/AppButton";
import { Heading } from "../../components/Heading";
import ToastAlert from "../../components/ToastAlert/ToastAlert";
import {
  useLazyGetInactiveListingsQuery,
  useBulkReviveListingsMutation,
  BulkReviveFailure,
} from "../../redux/api/adminApiSlice";
import { convertToFormattedDate } from "../../utils";

interface FilterState {
  province: string;
  city: string;
  expiredFrom: string;
  expiredTo: string;
  uploadedFrom: string;
  uploadedTo: string;
  landlord: string;
  page: number;
}

interface ToastState {
  open: boolean;
  message: string;
  type: "success" | "error" | "warning";
}

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

const MAX_BULK_REVIVE_IDS = 100;

function getBulkReviveLimitMessage() {
  return `You can revive up to ${MAX_BULK_REVIVE_IDS} listings at once. Split your selection into smaller batches.`;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const errorWithData = error as {
      data?: { message?: string };
      message?: string;
    };

    if (errorWithData.data?.message) {
      return errorWithData.data.message;
    }

    if (errorWithData.message) {
      return errorWithData.message;
    }
  }

  return "An error occurred during revival.";
}

function buildPageArray(totalPages: number, currentPage: number): PaginationItem[] {
  const pages: number[] = [];
  const addPage = (page: number) => {
    if (page >= 1 && page <= totalPages && pages.indexOf(page) === -1) {
      pages.push(page);
    }
  };

  addPage(1);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    addPage(page);
  }

  addPage(totalPages);
  pages.sort((left, right) => left - right);

  const items: PaginationItem[] = [];

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const previousPage = index > 0 ? pages[index - 1] : null;

    if (previousPage !== null && page - previousPage > 1) {
      items.push(previousPage === 1 ? "ellipsis-start" : "ellipsis-end");
    }

    items.push(page);
  }

  return items;
}

const AdminDashboard: React.FC = () => {
  const ROWS_PER_PAGE = 20;

  const [filters, setFilters] = useState<FilterState>({
    province: "",
    city: "",
    expiredFrom: "",
    expiredTo: "",
    uploadedFrom: "",
    uploadedTo: "",
    landlord: "",
    page: 1,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", type: "success" });

  const [triggerSearch, { data, isFetching }] = useLazyGetInactiveListingsQuery();
  const [bulkRevive, { isLoading: isReviving }] = useBulkReviveListingsMutation();

  const listings = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  const paginationItems = buildPageArray(totalPages, filters.page);
  const currentPageIds = listings.map((l) => l._id);
  const selectedCount = Object.keys(selectedIds).length;
  const currentPageSelectedCount = currentPageIds.filter((id) => selectedIds[id] === true).length;
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageSelectedCount === currentPageIds.length;
  const someCurrentPageSelected = currentPageSelectedCount > 0 && !allCurrentPageSelected;

  useEffect(() => {
    if (selectedCount === 0 && showConfirm) {
      setShowConfirm(false);
    }
  }, [selectedCount, showConfirm]);

  const handleFilterChange = (field: keyof FilterState, value: string | number) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setHasSearched(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
    setSelectedIds({});
    setShowConfirm(false);
    triggerSearch({ ...filters, page: 1, limit: ROWS_PER_PAGE });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    triggerSearch({ ...filters, page: newPage, limit: ROWS_PER_PAGE });
  };

  const handleRowCheck = (id: string) => {
    setSelectedIds((prev) => {
      const newRecord = Object.assign({}, prev);
      if (newRecord[id] === true) {
        delete newRecord[id];
      } else {
        newRecord[id] = true;
      }
      return newRecord;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const newRecord = Object.assign({}, prev);
      if (allCurrentPageSelected) {
        currentPageIds.forEach((id) => {
          delete newRecord[id];
        });
      } else {
        currentPageIds.forEach((id) => {
          newRecord[id] = true;
        });
      }
      return newRecord;
    });
  };

  const handleReviveClick = () => {
    if (selectedCount > MAX_BULK_REVIVE_IDS) {
      setToast({
        open: true,
        message: getBulkReviveLimitMessage(),
        type: "error",
      });
      setShowConfirm(false);
      return;
    }

    setShowConfirm(true);
  };

  const handleCancelRevive = () => {
    setShowConfirm(false);
  };

  const handleConfirmRevive = async () => {
    if (selectedCount === 0) {
      setShowConfirm(false);
      return;
    }

    if (selectedCount > MAX_BULK_REVIVE_IDS) {
      setToast({
        open: true,
        message: getBulkReviveLimitMessage(),
        type: "error",
      });
      setShowConfirm(false);
      return;
    }

    try {
      // Build id → name lookup map from current listings
      const idNameMap: Record<string, string> = {};
      listings.forEach((item) => {
        idNameMap[item._id] = item.name;
      });

      const result = await bulkRevive({ ids: Object.keys(selectedIds) }).unwrap();
      const revivedCount = result.revived.length;
      const failedCount = result.failed.length;
      let message = "";

      if (revivedCount > 0 && failedCount === 0) {
        message = `${revivedCount} listings revived successfully.`;
      } else if (revivedCount > 0 && failedCount > 0) {
        const failureDetails = result.failed
          .slice(0, 1)
          .map((f: BulkReviveFailure) => {
            const label = idNameMap[f.id ?? ""] || f.id || "Unknown listing";
            return `${label} — ${f.reason || "Unknown error"}`;
          })
          .join(", ");
        message = `${revivedCount} revived. ${failedCount} failed: ${failureDetails}`;
      } else {
        const failureDetails = result.failed
          .slice(0, 1)
          .map((f: BulkReviveFailure) => {
            const label = idNameMap[f.id ?? ""] || f.id || "Unknown listing";
            return `${label} — ${f.reason || "Unknown error"}`;
          })
          .join(", ");
        message = `Revival failed. No listings were revived. ${failureDetails}`;
      }

      setToast({ open: true, message, type: revivedCount > 0 && failedCount === 0 ? "success" : failedCount > 0 && revivedCount === 0 ? "error" : "warning" });
      setSelectedIds({});
      setShowConfirm(false);
      triggerSearch({ ...filters, page: filters.page, limit: ROWS_PER_PAGE });
    } catch (error) {
      setToast({ open: true, message: getErrorMessage(error), type: "error" });
    }
  };

  return (
    <Box sx={{ mt: { xs: 5, md: 6 } }}>
      <AppContainer>
        <Heading sx={{ mb: "20px" }}>Admin — Expired Listings</Heading>

        <Paper sx={{ p: 2, mb: 2, borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "none" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>
            {/* Province */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Province</Typography>
              <input
                type="text"
                value={filters.province}
                onChange={(e) => handleFilterChange("province", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", width: "120px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* City */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>City</Typography>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", width: "120px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* Expired From */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Expired From</Typography>
              <input
                type="date"
                value={filters.expiredFrom}
                onChange={(e) => handleFilterChange("expiredFrom", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* Expired To */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Expired To</Typography>
              <input
                type="date"
                value={filters.expiredTo}
                onChange={(e) => handleFilterChange("expiredTo", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* Uploaded From */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Uploaded From</Typography>
              <input
                type="date"
                value={filters.uploadedFrom}
                onChange={(e) => handleFilterChange("uploadedFrom", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* Uploaded To */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Uploaded To</Typography>
              <input
                type="date"
                value={filters.uploadedTo}
                onChange={(e) => handleFilterChange("uploadedTo", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            {/* Landlord */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Landlord</Typography>
              <input
                type="text"
                value={filters.landlord}
                onChange={(e) => handleFilterChange("landlord", e.target.value)}
                disabled={isReviving}
                style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", width: "120px", opacity: isReviving ? 0.5 : 1 }}
              />
            </Box>
            <AppButton onClick={handleSearch} disabled={isReviving}>Search</AppButton>
          </Box>
        </Paper>

        {hasSearched && (
          <>
            {showConfirm && (
              <Box sx={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "8px", p: "12px 16px", display: "flex", alignItems: "center", gap: 2, mb: 1.5, fontSize: "13px", color: "#92400e" }}>
                <Typography variant="body2" sx={{ flex: 1, color: "#92400e" }}>
                  Revive {selectedCount} listing{selectedCount !== 1 ? "s" : ""}? Each landlord will receive a 48-hour payment window and an email notification.
                </Typography>
                <AppButton size="small" onClick={handleConfirmRevive} disabled={selectedCount === 0 || isReviving}>
                  {isReviving ? <CircularProgress size={16} color="inherit" /> : "Confirm"}
                </AppButton>
                <AppButton size="small" variant="outlined" onClick={handleCancelRevive} disabled={isReviving}>
                  Cancel
                </AppButton>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: "#374151", fontWeight: 500 }}>
                {selectedCount > 0 ? `${selectedCount} listing${selectedCount !== 1 ? "s" : ""} selected` : ""}
              </Typography>
              <AppButton onClick={handleReviveClick} disabled={selectedCount === 0 || isReviving}>
                Revive Selected
              </AppButton>
            </Box>
          </>
        )}

        {!hasSearched ? (
          <AppCard sx={{ p: "48px", textAlign: "center", color: "#9ca3af" }}>
            Use the filters above to find expired listings.
          </AppCard>
        ) : isFetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : listings.length === 0 ? (
          <AppCard sx={{ p: "48px", textAlign: "center", color: "#9ca3af" }}>
            No expired listings match your filters.
          </AppCard>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(15,23,42,0.06)", overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      indeterminate={someCurrentPageSelected}
                      onChange={handleSelectAll}
                      disabled={isReviving}
                    />
                  </TableCell>
                  {["Listing", "Landlord", "Location", "Date Uploaded", "Date Expired"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.map((item) => (
                  <TableRow key={item._id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds[item._id] === true}
                        onChange={() => handleRowCheck(item._id)}
                        disabled={isReviving}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>
                      <Box>{item.user?.username ?? "—"}</Box>
                      <Box sx={{ fontSize: "11px", color: "#9ca3af" }}>{item.user?.email ?? ""}</Box>
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {[item.location?.province, item.location?.city].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {item.createdAt ? convertToFormattedDate(item.createdAt) : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                      {item.paymentDeadline ? convertToFormattedDate(item.paymentDeadline) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {hasSearched && !isFetching && totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
            {paginationItems.map((item, index) =>
              typeof item !== "number" ? (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ display: "flex", alignItems: "center", px: 0.5, color: "#9ca3af" }}
                >
                  ...
                </Typography>
              ) : (
                <AppButton
                  key={item}
                  size="small"
                  variant={filters.page === item ? "contained" : "outlined"}
                  onClick={() => handlePageChange(item)}
                  disabled={isReviving}
                >
                  {item}
                </AppButton>
              )
            )}
          </Box>
        )}
      </AppContainer>

      <ToastAlert
        appearence={toast.open}
        type={toast.type}
        message={toast.message}
        handleClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
};

export default AdminDashboard;
