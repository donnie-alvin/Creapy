import { apiSlice } from "./apiSlice";

const toEntityArray = (response: any, keys: string[]) => {
  for (const key of keys) {
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }

    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  return [];
};

const toEntityObject = (response: any, keys: string[]) => {
  for (const key of keys) {
    if (response?.data?.[key]) {
      return response.data[key];
    }

    if (response?.[key]) {
      return response[key];
    }
  }

  return response?.data || response || null;
};

export const providerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerProvider: builder.mutation({
      query: (data) => ({
        url: "providers/register",
        method: "POST",
        body: data,
      }),
    }),
    getMyRooms: builder.query({
      query: () => ({
        url: "rooms/mine",
        method: "GET",
      }),
      providesTags: (result) => {
        const rooms = toEntityArray(result, ["rooms", "data"]);
        return [
          { type: "Room", id: "LIST" },
          ...rooms.map((room: any) => ({ type: "Room" as const, id: room?._id })),
        ];
      },
    }),
    getProviderRoom: builder.query({
      query: (roomId) => ({
        url: `rooms/${roomId}`,
        method: "GET",
      }),
      providesTags: (result, error, roomId) => [
        { type: "Room", id: roomId },
        { type: "ProviderAvailability", id: roomId },
      ],
    }),
    createRoom: builder.mutation({
      query: (data) => ({
        url: "rooms",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Room", id: "LIST" }],
    }),
    updateRoom: builder.mutation({
      query: ({ id, payload }) => ({
        url: `rooms/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Room", id },
        { type: "Room", id: "LIST" },
        { type: "ProviderAvailability", id },
      ],
    }),
    deleteRoom: builder.mutation({
      query: (roomId) => ({
        url: `rooms/${roomId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, roomId) => [
        { type: "Room", id: roomId },
        { type: "Room", id: "LIST" },
        { type: "ProviderAvailability", id: roomId },
        { type: "ProviderBooking", id: "LIST" },
      ],
    }),
    blockRoomDates: builder.mutation({
      async queryFn(
        { roomId, payload },
        _api,
        _extraOptions,
        fetchWithBQ
      ) {
        const primaryResult = await fetchWithBQ({
          url: `rooms/${roomId}/blocks`,
          method: "POST",
          body: payload,
        });

        if (!primaryResult.error) {
          return { data: primaryResult.data };
        }

        const fallbackResult = await fetchWithBQ({
          url: `rooms/${roomId}/block`,
          method: "POST",
          body: payload,
        });

        if (fallbackResult.error) {
          return { error: fallbackResult.error };
        }

        return { data: fallbackResult.data };
      },
      invalidatesTags: (result, error, { roomId }) => [
        { type: "Room", id: roomId },
        { type: "Room", id: "LIST" },
        { type: "ProviderAvailability", id: roomId },
      ],
    }),
    getRoomAvailability: builder.query({
      query: ({ roomId, checkIn, checkOut }) => ({
        url: `rooms/${roomId}/availability?checkIn=${encodeURIComponent(
          checkIn
        )}&checkOut=${encodeURIComponent(checkOut)}`,
        method: "GET",
      }),
      providesTags: (result, error, { roomId }) => [
        { type: "ProviderAvailability", id: roomId },
      ],
    }),
    getProviderBookings: builder.query({
      query: () => ({
        url: "bookings/provider",
        method: "GET",
      }),
      providesTags: (result) => {
        const bookings = toEntityArray(result, ["bookings", "data"]);
        return [
          { type: "ProviderBooking", id: "LIST" },
          ...bookings.map((booking: any) => ({
            type: "ProviderBooking" as const,
            id: booking?._id,
          })),
        ];
      },
    }),
    confirmBooking: builder.mutation({
      query: (bookingId) => ({
        url: `bookings/${bookingId}/confirm`,
        method: "POST",
      }),
      invalidatesTags: (result, error, bookingId) => [
        { type: "ProviderBooking", id: bookingId },
        { type: "ProviderBooking", id: "LIST" },
        { type: "ProviderSettlement", id: "SUMMARY" },
      ],
    }),
    declineBooking: builder.mutation({
      query: (bookingId) => ({
        url: `bookings/${bookingId}/decline`,
        method: "POST",
      }),
      invalidatesTags: (result, error, bookingId) => [
        { type: "ProviderBooking", id: bookingId },
        { type: "ProviderBooking", id: "LIST" },
        { type: "ProviderSettlement", id: "SUMMARY" },
      ],
    }),
    cancelBooking: builder.mutation({
      query: (bookingId) => ({
        url: `bookings/${bookingId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, bookingId) => [
        { type: "ProviderBooking", id: bookingId },
        { type: "ProviderBooking", id: "LIST" },
        { type: "ProviderSettlement", id: "SUMMARY" },
      ],
    }),
    getProviderProfile: builder.query({
      query: () => ({
        url: "providers/me",
        method: "GET",
      }),
      providesTags: [{ type: "ProviderProfile", id: "ME" }],
    }),
    updateProviderProfile: builder.mutation({
      query: (payload) => ({
        url: "providers/me",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [
        { type: "ProviderProfile", id: "ME" },
        { type: "ProviderSettlement", id: "SUMMARY" },
      ],
    }),
    getProviderSettlementsSummary: builder.query({
      query: () => ({
        url: "providers/me/settlements",
        method: "GET",
      }),
      providesTags: [{ type: "ProviderSettlement", id: "SUMMARY" }],
    }),
  }),
});

export const {
  useRegisterProviderMutation,
  useGetMyRoomsQuery,
  useGetProviderRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useBlockRoomDatesMutation,
  useGetRoomAvailabilityQuery,
  useGetProviderBookingsQuery,
  useConfirmBookingMutation,
  useDeclineBookingMutation,
  useCancelBookingMutation,
  useGetProviderProfileQuery,
  useUpdateProviderProfileMutation,
  useGetProviderSettlementsSummaryQuery,
} = providerApiSlice;

export { toEntityArray, toEntityObject };
