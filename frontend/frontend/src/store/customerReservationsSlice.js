import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getAvailableSlots,
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservationApi,
  getPreOrder,
  createPreOrderApi,
  updatePreOrderApi,
  cancelPreOrderApi,
} from '../services/customerReservationsApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  return message || fallback
}

export const fetchAvailableSlots = createAsyncThunk(
  'customerReservations/fetchSlots',
  async ({ restaurantId, date, partySize }, { rejectWithValue }) => {
    try {
      const res = await getAvailableSlots(restaurantId, date, partySize)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load available time slots'))
    }
  },
)

export const createReservationThunk = createAsyncThunk(
  'customerReservations/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await createReservation(data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to create reservation'))
    }
  },
)

export const fetchMyReservations = createAsyncThunk(
  'customerReservations/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getMyReservations(params)
      return { ...res.data, request: params }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load reservations'))
    }
  },
)

export const fetchReservationDetail = createAsyncThunk(
  'customerReservations/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await getReservation(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load reservation'))
    }
  },
)

export const cancelReservation = createAsyncThunk(
  'customerReservations/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const res = await cancelReservationApi(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to cancel reservation'))
    }
  },
)

export const fetchPreOrder = createAsyncThunk(
  'customerReservations/fetchPreOrder',
  async (reservationId, { rejectWithValue }) => {
    try {
      const res = await getPreOrder(reservationId)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load pre-order'))
    }
  },
)

export const createPreOrder = createAsyncThunk(
  'customerReservations/createPreOrder',
  async ({ reservationId, items }, { rejectWithValue }) => {
    try {
      const res = await createPreOrderApi(reservationId, { items })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to create pre-order'))
    }
  },
)

export const updatePreOrder = createAsyncThunk(
  'customerReservations/updatePreOrder',
  async ({ reservationId, items }, { rejectWithValue }) => {
    try {
      const res = await updatePreOrderApi(reservationId, { items })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update pre-order'))
    }
  },
)

export const cancelPreOrder = createAsyncThunk(
  'customerReservations/cancelPreOrder',
  async (reservationId, { rejectWithValue }) => {
    try {
      const res = await cancelPreOrderApi(reservationId)
      return { reservationId, order: res.data }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to cancel pre-order'))
    }
  },
)

const customerReservationsSlice = createSlice({
  name: 'customerReservations',
  initialState: {
    list: [],
    detail: null,
    slots: [],
    slotsMeta: null,
    loading: false,
    loadingSlots: false,
    creating: false,
    cancelling: false,
    preOrder: null,
    canModifyPreOrder: true,
    loadingPreOrder: false,
    savingPreOrder: false,
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    filters: { status: '', from: '', to: '' },
    error: null,
    success: null,
  },
  reducers: {
    clearReservationFeedback: (state) => {
      state.error = null
      state.success = null
    },
    clearSlots: (state) => {
      state.slots = []
      state.slotsMeta = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.loadingSlots = true
        state.error = null
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.loadingSlots = false
        state.slots = action.payload?.slots || []
        state.slotsMeta = action.payload
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.loadingSlots = false
        state.slots = []
        state.error = action.payload
      })
      .addCase(createReservationThunk.pending, (state) => {
        state.creating = true
        state.error = null
        state.success = null
      })
      .addCase(createReservationThunk.fulfilled, (state, action) => {
        state.creating = false
        state.success = 'Reservation confirmed'
        state.detail = action.payload
        state.list = [action.payload, ...state.list.filter((row) => row._id !== action.payload._id)]
      })
      .addCase(createReservationThunk.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
      })
      .addCase(fetchMyReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyReservations.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload?.data || []
        state.total = action.payload?.total || 0
        state.page = action.payload?.page || 1
        state.totalPages = action.payload?.totalPages || 0
        const request = action.payload?.request || {}
        state.limit = request.limit || state.limit
        state.filters = {
          status: request.status || '',
          from: request.from || '',
          to: request.to || '',
        }
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchReservationDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReservationDetail.fulfilled, (state, action) => {
        state.loading = false
        state.detail = action.payload
      })
      .addCase(fetchReservationDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(cancelReservation.pending, (state) => {
        state.cancelling = true
        state.error = null
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.cancelling = false
        state.detail = action.payload
        const idx = state.list.findIndex((row) => row._id === action.payload._id)
        if (idx !== -1) state.list[idx] = action.payload
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.cancelling = false
        state.error = action.payload
      })
      .addCase(fetchPreOrder.pending, (state) => {
        state.loadingPreOrder = true
        state.error = null
      })
      .addCase(fetchPreOrder.fulfilled, (state, action) => {
        state.loadingPreOrder = false
        state.preOrder = action.payload?.preOrder || null
        state.canModifyPreOrder = Boolean(action.payload?.canModify)
      })
      .addCase(fetchPreOrder.rejected, (state, action) => {
        state.loadingPreOrder = false
        state.error = action.payload
      })
      .addCase(createPreOrder.pending, (state) => {
        state.savingPreOrder = true
        state.error = null
        state.success = null
      })
      .addCase(createPreOrder.fulfilled, (state, action) => {
        state.savingPreOrder = false
        state.preOrder = action.payload
        state.success = 'Pre-order saved'
        if (state.detail) {
          const itemCount = (action.payload.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          state.detail.preOrder = {
            _id: action.payload._id,
            itemCount,
            totalAmount: action.payload.totalAmount,
            status: action.payload.status,
          }
        }
      })
      .addCase(createPreOrder.rejected, (state, action) => {
        state.savingPreOrder = false
        state.error = action.payload
      })
      .addCase(updatePreOrder.pending, (state) => {
        state.savingPreOrder = true
        state.error = null
        state.success = null
      })
      .addCase(updatePreOrder.fulfilled, (state, action) => {
        state.savingPreOrder = false
        state.preOrder = action.payload
        state.success = 'Pre-order updated'
        if (state.detail) {
          const itemCount = (action.payload.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          state.detail.preOrder = {
            _id: action.payload._id,
            itemCount,
            totalAmount: action.payload.totalAmount,
            status: action.payload.status,
          }
        }
      })
      .addCase(updatePreOrder.rejected, (state, action) => {
        state.savingPreOrder = false
        state.error = action.payload
      })
      .addCase(cancelPreOrder.pending, (state) => {
        state.savingPreOrder = true
        state.error = null
      })
      .addCase(cancelPreOrder.fulfilled, (state) => {
        state.savingPreOrder = false
        state.preOrder = null
        state.success = 'Pre-order cancelled'
        if (state.detail) state.detail.preOrder = null
      })
      .addCase(cancelPreOrder.rejected, (state, action) => {
        state.savingPreOrder = false
        state.error = action.payload
      })
  },
})

export const { clearReservationFeedback, clearSlots } = customerReservationsSlice.actions
export default customerReservationsSlice.reducer
