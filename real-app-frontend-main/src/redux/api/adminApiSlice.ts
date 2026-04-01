import { apiSlice } from "./apiSlice";

interface InactiveListingsParams {
  province?: string;
  city?: string;
  expiredFrom?: string;
  expiredTo?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  landlord?: string;
  page?: number;
  limit?: number;
}

interface AdminListing {
  _id: string;
  name: string;
  user?: {
    username?: string;
    email?: string;
  };
  location?: {
    province?: string;
    city?: string;
  };
  createdAt?: string;
  paymentDeadline?: string;
}

interface InactiveListingsResponse {
  data: AdminListing[];
  total: number;
}

interface BulkReviveRequest {
  ids: string[];
}

export interface BulkReviveFailure {
  id: string;
  reason: string;
}

interface BulkReviveResponse {
  revived: string[];
  failed: BulkReviveFailure[];
}

export interface ProviderFilters {
  verificationStatus?: string;
  search?: string;
}

export interface ProviderRecord {
  _id: string;
  username: string;
  email?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  roomCount?: number;
  createdAt?: string | null;
  providerProfile: {
    verificationStatus: string;
    commissionRate: number;
    verifiedAt?: string | null;
    verificationNotes?: string | null;
  };
}

interface ProvidersResponse {
  data: ProviderRecord[];
  total: number;
}

interface VerifyProviderRequest {
  id: string;
  verificationStatus: "approved" | "rejected" | "pending";
  verificationNotes?: string;
}

interface UpdateCommissionRateRequest {
  id: string;
  commissionRate: number;
}

export interface BookingFilters {
  status?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  settlementStatus?: string;
}

export interface AdminBooking {
  _id: string;
  room?: {
    _id: string;
    name?: string | null;
    location?: {
      province?: string;
      city?: string;
    } | null;
  } | null;
  provider?: {
    _id: string;
    username?: string | null;
    email?: string | null;
  } | null;
  checkIn?: string;
  checkOut?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  settlementStatus?: string;
  settledAt?: string | null;
}

interface AdminBookingsResponse {
  data: AdminBooking[];
  total: number;
}

interface SettleBookingRequest {
  id: string;
  settlementReference?: string;
}

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInactiveListings: builder.query<InactiveListingsResponse, InactiveListingsParams>({
      query: (params) => ({
        url: `admin/listings/inactive${buildSearchParams(
          (params || {}) as Record<string, string | number | undefined>
        )}`,
        method: "GET",
      }),
      providesTags: ["AdminListing"],
    }),
    bulkReviveListings: builder.mutation<BulkReviveResponse, BulkReviveRequest>({
      query: ({ ids }) => ({
        url: "admin/listings/bulk-revive",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: ["AdminListing"],
    }),
    getProviders: builder.query<ProvidersResponse, ProviderFilters | void>({
      query: (params) => ({
        url: `providers${buildSearchParams(
          (params || {}) as Record<string, string | number | undefined>
        )}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((provider) => ({
                type: "Provider" as const,
                id: provider._id,
              })),
              { type: "Provider" as const, id: "LIST" },
            ]
          : [{ type: "Provider" as const, id: "LIST" }],
    }),
    verifyProvider: builder.mutation<ProviderRecord, VerifyProviderRequest>({
      query: ({ id, ...body }) => ({
        url: `providers/${id}/verify`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { data: ProviderRecord }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Provider", id },
        { type: "Provider", id: "LIST" },
      ],
    }),
    updateCommissionRate: builder.mutation<ProviderRecord, UpdateCommissionRateRequest>({
      query: ({ id, commissionRate }) => ({
        url: `providers/${id}/commission`,
        method: "PUT",
        body: { commissionRate },
      }),
      transformResponse: (response: { data: ProviderRecord }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Provider", id },
        { type: "Provider", id: "LIST" },
      ],
    }),
    getAllBookings: builder.query<AdminBookingsResponse, BookingFilters | void>({
      query: (params) => ({
        url: `bookings${buildSearchParams(
          (params || {}) as Record<string, string | number | undefined>
        )}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((booking) => ({
                type: "AdminBooking" as const,
                id: booking._id,
              })),
              { type: "AdminBooking" as const, id: "LIST" },
            ]
          : [{ type: "AdminBooking" as const, id: "LIST" }],
    }),
    settleBooking: builder.mutation<AdminBooking, SettleBookingRequest>({
      query: ({ id, settlementReference }) => ({
        url: `bookings/${id}/settle`,
        method: "PUT",
        body: settlementReference ? { settlementReference } : {},
      }),
      transformResponse: (response: { data: AdminBooking }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminBooking", id },
        { type: "AdminBooking", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetInactiveListingsQuery,
  useLazyGetInactiveListingsQuery,
  useBulkReviveListingsMutation,
  useGetProvidersQuery,
  useVerifyProviderMutation,
  useUpdateCommissionRateMutation,
  useGetAllBookingsQuery,
  useSettleBookingMutation,
} = adminApiSlice;
