import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getStaffOrders, updateStaffOrderStatus } from '../services/orderApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || fallback
}

export const fetchStaffOrders = createAsyncThunk(
  'staffOrders/fetchAll',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await getStaffOrders(restaurantId)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load orders'))
    }
  }
)

export const updateOrderStatusThunk = createAsyncThunk(
  'staffOrders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await updateStaffOrderStatus(id, status)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update order status'))
    }
  }
)

const orderSlice = createSlice({
  name: 'staffOrders',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearStaffOrderError: (state) => { state.error = null } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStaffOrders.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchStaffOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((order) => order._id === action.payload._id)
        if (idx !== -1) state.list[idx] = action.payload
        state.error = null
      })
      .addCase(updateOrderStatusThunk.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearStaffOrderError } = orderSlice.actions
export default orderSlice.reducer
