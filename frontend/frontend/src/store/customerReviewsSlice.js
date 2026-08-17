import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getEligibleReviews,
  createReviewApi,
  getMyReviews,
  updateReviewApi,
  deleteReviewApi,
  getRestaurantReviews,
} from '../services/customerReviewsApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  return message || fallback
}

export const fetchEligibleReviews = createAsyncThunk(
  'customerReviews/fetchEligible',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await getEligibleReviews(restaurantId)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load review eligibility'))
    }
  },
)

export const createReview = createAsyncThunk(
  'customerReviews/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await createReviewApi(data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to submit review'))
    }
  },
)

export const fetchMyReviews = createAsyncThunk(
  'customerReviews/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMyReviews()
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load your reviews'))
    }
  },
)

export const updateReview = createAsyncThunk(
  'customerReviews/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateReviewApi(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update review'))
    }
  },
)

export const deleteReview = createAsyncThunk(
  'customerReviews/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteReviewApi(id)
      return id
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to delete review'))
    }
  },
)

export const fetchRestaurantReviews = createAsyncThunk(
  'customerReviews/fetchRestaurant',
  async ({ restaurantId, page = 1, limit = 5, sort = 'newest' }, { rejectWithValue }) => {
    try {
      const res = await getRestaurantReviews(restaurantId, { page, limit, sort })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load reviews'))
    }
  },
)

const customerReviewsSlice = createSlice({
  name: 'customerReviews',
  initialState: {
    mine: [],
    eligible: { restaurantId: null, orders: [], reservations: [] },
    restaurantReviews: [],
    restaurantMeta: null,
    page: 1,
    totalPages: 0,
    total: 0,
    sort: 'newest',
    loading: false,
    loadingEligible: false,
    loadingPublic: false,
    saving: false,
    error: null,
    success: null,
  },
  reducers: {
    clearReviewFeedback: (state) => {
      state.error = null
      state.success = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEligibleReviews.pending, (state) => {
        state.loadingEligible = true
        state.error = null
      })
      .addCase(fetchEligibleReviews.fulfilled, (state, action) => {
        state.loadingEligible = false
        state.eligible = action.payload || { restaurantId: null, orders: [], reservations: [] }
      })
      .addCase(fetchEligibleReviews.rejected, (state, action) => {
        state.loadingEligible = false
        state.error = action.payload
      })
      .addCase(createReview.pending, (state) => {
        state.saving = true
        state.error = null
        state.success = null
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.saving = false
        state.success = 'Review submitted'
        state.mine = [action.payload, ...state.mine.filter((row) => row._id !== action.payload._id)]
        const orderId = action.payload.orderId?._id || action.payload.orderId
        const reservationId = action.payload.reservationId?._id || action.payload.reservationId
        state.eligible.orders = state.eligible.orders.filter((row) => String(row._id) !== String(orderId || ''))
        state.eligible.reservations = state.eligible.reservations.filter(
          (row) => String(row._id) !== String(reservationId || ''),
        )
      })
      .addCase(createReview.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false
        state.mine = action.payload || []
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateReview.pending, (state) => {
        state.saving = true
        state.error = null
        state.success = null
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.saving = false
        state.success = 'Review updated'
        const idx = state.mine.findIndex((row) => row._id === action.payload._id)
        if (idx !== -1) state.mine[idx] = action.payload
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(deleteReview.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.saving = false
        state.success = 'Review deleted'
        state.mine = state.mine.filter((row) => row._id !== action.payload)
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(fetchRestaurantReviews.pending, (state) => {
        state.loadingPublic = true
      })
      .addCase(fetchRestaurantReviews.fulfilled, (state, action) => {
        state.loadingPublic = false
        state.restaurantReviews = action.payload?.data || []
        state.restaurantMeta = action.payload?.restaurant || null
        state.page = action.payload?.page || 1
        state.totalPages = action.payload?.totalPages || 0
        state.total = action.payload?.total || 0
      })
      .addCase(fetchRestaurantReviews.rejected, (state, action) => {
        state.loadingPublic = false
        state.error = action.payload
      })
  },
})

export const { clearReviewFeedback } = customerReviewsSlice.actions
export default customerReviewsSlice.reducer
