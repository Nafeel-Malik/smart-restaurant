import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  placeCustomerOrder,
  getCustomerOrders,
  getCustomerOrder,
  getCustomerOrderReceipt,
  cancelCustomerOrder,
} from '../services/customerOrdersApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  return message || fallback
}

export const fetchMyOrders = createAsyncThunk(
  'customerOrders/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getCustomerOrders(params)
      return { ...res.data, request: params }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load orders'))
    }
  }
)

export const fetchOrderDetail = createAsyncThunk(
  'customerOrders/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await getCustomerOrder(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load order'))
    }
  }
)

export const fetchOrderReceipt = createAsyncThunk(
  'customerOrders/fetchReceipt',
  async (id, { rejectWithValue }) => {
    try {
      const res = await getCustomerOrderReceipt(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load receipt'))
    }
  }
)

export const placeOrder = createAsyncThunk(
  'customerOrders/place',
  async (data, { rejectWithValue }) => {
    try {
      const res = await placeCustomerOrder(data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to place order'))
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'customerOrders/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const res = await cancelCustomerOrder(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to cancel order'))
    }
  }
)

const customerOrdersSlice = createSlice({
  name: 'customerOrders',
  initialState: {
    list: [],
    detail: null,
    receipt: null,
    loading: false,
    placing: false,
    cancelling: false,
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    filters: { status: '', orderType: '', from: '', to: '' },
    error: null,
    success: null,
  },
  reducers: {
    clearOrderFeedback: (state) => {
      state.error = null
      state.success = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload?.data || []
        state.total = action.payload?.total || 0
        state.page = action.payload?.page || 1
        state.totalPages = action.payload?.totalPages || 0
        const request = action.payload?.request || {}
        state.limit = request.limit || state.limit
        state.filters = {
          status: request.status || '',
          orderType: request.orderType || '',
          from: request.from || '',
          to: request.to || '',
        }
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.loading = false
        state.detail = action.payload
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchOrderReceipt.fulfilled, (state, action) => {
        state.receipt = action.payload
      })
      .addCase(placeOrder.pending, (state) => {
        state.placing = true
        state.error = null
        state.success = null
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false
        state.success = 'Order placed successfully'
        state.detail = action.payload
        state.list.unshift(action.payload)
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placing = false
        state.error = action.payload
      })
      .addCase(cancelOrder.pending, (state) => {
        state.cancelling = true
        state.error = null
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancelling = false
        state.detail = action.payload
        const idx = state.list.findIndex((order) => order._id === action.payload._id)
        if (idx !== -1) state.list[idx] = action.payload
        if (state.receipt) state.receipt.status = action.payload.status
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancelling = false
        state.error = action.payload
      })
  },
})

export const { clearOrderFeedback } = customerOrdersSlice.actions
export default customerOrdersSlice.reducer
