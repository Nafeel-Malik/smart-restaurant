import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getActivitySummary } from '../services/customerActivityApi'
import { getCustomerOrders } from '../services/customerOrdersApi'
import { getMyReservations } from '../services/customerReservationsApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  return message || fallback
}

export const fetchActivity = createAsyncThunk('customerActivity/fetch', async (_, { rejectWithValue }) => {
  try {
    const [summaryRes, ordersRes, reservationsRes] = await Promise.all([
      getActivitySummary(),
      getCustomerOrders({ page: 1, limit: 5 }),
      getMyReservations({ page: 1, limit: 5 }),
    ])
    return {
      summary: summaryRes.data,
      recentOrders: ordersRes.data?.data || [],
      recentReservations: reservationsRes.data?.data || [],
    }
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to load activity'))
  }
})

const customerActivitySlice = createSlice({
  name: 'customerActivity',
  initialState: {
    summary: null,
    recentOrders: [],
    recentReservations: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading = false
        state.summary = action.payload.summary
        state.recentOrders = action.payload.recentOrders
        state.recentReservations = action.payload.recentReservations
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default customerActivitySlice.reducer
