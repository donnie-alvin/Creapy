import { apiSlice } from "./apiSlice";

export interface StaySearchParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  searchTerm?: string;
  businessType?: string;
  bookingMode?: string;
  amenities?: string[] | string;
  sort?: string;
}

export interface StayAvailabilityParams {
  roomId: string;
  checkIn: string;
  checkOut: string;
}

export interface CreateBookingPayload {
  room: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  specialRequests?: string;
  totalPrice?: number;
}

export interface InitiateBookingPaymentPayload {
  bookingId?: string;
  phone?: string;
  amount?: number;
  [key: string]: any;
}

type FetchWithBQ = (arg: any) => any;

const buildSearchQuery = (params?: StaySearchParams | void) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

const extractCollection = <T>(response: any, keys: string[]): T[] => {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    const directValue = response?.[key];
    if (Array.isArray(directValue)) return directValue;

    const nestedValue = response?.data?.[key];
    if (Array.isArray(nestedValue)) return nestedValue;
  }

  if (Array.isArray(response?.data)) return response.data;

  return [];
};

const extractEntity = <T>(response: any, keys: string[]): T | null => {
  for (const key of keys) {
    const directValue = response?.[key];
    if (directValue) return directValue;

    const nestedValue = response?.data?.[key];
    if (nestedValue) return nestedValue;
  }

  return response?.data || response || null;
};

const tryCollectionEndpoints = async (
  fetchWithBQ: FetchWithBQ,
  candidates: Array<{ url: string; method?: "GET" | "POST"; body?: unknown }>,
  keys: string[]
): Promise<{ data: any[] } | { error: any }> => {
  let lastError: any;

  for (const candidate of candidates) {
    const result = await fetchWithBQ(candidate);

    if (!result.error) {
      return { data: extractCollection<any>(result.data, keys) };
    }

    lastError = result.error;
    const status = Number((result.error as any)?.status);

    if (status && ![404, 405].includes(status)) {
      return { error: result.error };
    }
  }

  return { error: lastError || { status: 404, data: { message: "Stay endpoint not found" } } };
};

const tryEntityEndpoints = async (
  fetchWithBQ: FetchWithBQ,
  candidates: Array<{ url: string; method?: "GET" | "POST"; body?: unknown }>,
  keys: string[]
): Promise<{ data: any } | { error: any }> => {
  let lastError: any;

  for (const candidate of candidates) {
    const result = await fetchWithBQ(candidate);

    if (!result.error) {
      return { data: extractEntity<any>(result.data, keys) || result.data || {} };
    }

    lastError = result.error;
    const status = Number((result.error as any)?.status);

    if (status && ![404, 405].includes(status)) {
      return { error: result.error };
    }
  }

  return { error: lastError || { status: 404, data: { message: "Stay endpoint not found" } } };
};

export const stayApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchStays: builder.query<any[], StaySearchParams | void>({
      async queryFn(params, _api, _extraOptions, fetchWithBQ) {
        const query = buildSearchQuery(params);
        const suffix = query ? `?${query}` : "";

        return tryCollectionEndpoints(
          fetchWithBQ,
          [
            { url: `rooms/search${suffix}` },
            { url: `rooms${suffix}` },
            { url: `stays/search${suffix}` },
            { url: `stays${suffix}` },
          ],
          ["rooms", "stays", "results"]
        );
      },
      providesTags: ["Stay"],
    }),
    getStayById: builder.query<any, string>({
      async queryFn(roomId, _api, _extraOptions, fetchWithBQ) {
        return tryEntityEndpoints(
          fetchWithBQ,
          [
            { url: `rooms/public/${roomId}` },
            { url: `rooms/${roomId}` },
            { url: `stays/rooms/${roomId}` },
            { url: `stays/${roomId}` },
          ],
          ["room", "stay"]
        );
      },
      providesTags: (_result, _error, roomId) => [{ type: "Stay", id: roomId }],
    }),
    getRoomAvailability: builder.query<any, StayAvailabilityParams>({
      query: ({ roomId, checkIn, checkOut }) => ({
        url: `rooms/${roomId}/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, arg) => [{ type: "Stay", id: arg.roomId }],
    }),
    getProviderProfile: builder.query<any, string>({
      query: (providerId) => ({
        url: `stays/${providerId}`,
        method: "GET",
      }),
      providesTags: ["Provider"],
    }),
    createBooking: builder.mutation<any, CreateBookingPayload>({
      async queryFn(payload, _api, _extraOptions, fetchWithBQ) {
        return tryEntityEndpoints(
          fetchWithBQ,
          [
            { url: "bookings", method: "POST", body: payload },
            { url: "stays/bookings", method: "POST", body: payload },
            { url: `rooms/${payload.room}/bookings`, method: "POST", body: payload },
          ],
          ["booking"]
        );
      },
      invalidatesTags: ["StayBooking", "Stay"],
    }),
    initiateBookingPayment: builder.mutation<any, InitiateBookingPaymentPayload>({
      query: (body) => ({
        url: "bookings/initiate-payment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StayBooking"],
    }),
    cancelBooking: builder.mutation<any, { id: string; body: { reason?: string } }>({
      query: ({ id, body }) => ({
        url: `bookings/${id}/cancel`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["StayBooking", "Stay"],
    }),
    getMyBookings: builder.query<any[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        return tryCollectionEndpoints(
          fetchWithBQ,
          [
            { url: "bookings/mine" },
            { url: "stays/bookings/mine" },
            { url: "bookings" },
          ],
          ["bookings", "results"]
        );
      },
      providesTags: ["StayBooking"],
    }),
  }),
});

export const {
  useSearchStaysQuery,
  useGetStayByIdQuery,
  useGetRoomAvailabilityQuery,
  useGetProviderProfileQuery,
  useCreateBookingMutation,
  useInitiateBookingPaymentMutation,
  useCancelBookingMutation,
  useGetMyBookingsQuery,
} = stayApiSlice;
