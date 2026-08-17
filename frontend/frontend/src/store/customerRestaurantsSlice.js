import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getCustomerRestaurants,
  getCustomerRestaurant,
  getCustomerRestaurantMenu,
} from '../services/customerRestaurantsApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  return message || fallback
}

export const fetchCustomerRestaurants = createAsyncThunk(
  'customerRestaurants/fetchAll',
  async (search, { rejectWithValue }) => {
    try {
      const res = await getCustomerRestaurants(search)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load restaurants'))
    }
  }
)

export const fetchCustomerRestaurant = createAsyncThunk(
  'customerRestaurants/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await getCustomerRestaurant(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load restaurant'))
    }
  }
)

export const fetchCustomerRestaurantMenu = createAsyncThunk(
  'customerRestaurants/fetchMenu',
  async (id, { rejectWithValue }) => {
    try {
      const res = await getCustomerRestaurantMenu(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load menu'))
    }
  }
)

const customerRestaurantsSlice = createSlice({
  name: 'customerRestaurants',
  initialState: {
    list: [],
    detail: null,
    menu: [],
    loadingList: false,
    loadingMenu: false,
    error: null,
  },
  reducers: {
    clearRestaurantError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerRestaurants.pending, (state) => {
        state.loadingList = true
        state.error = null
      })
      .addCase(fetchCustomerRestaurants.fulfilled, (state, action) => {
        state.loadingList = false
        state.list = action.payload || []
      })
      .addCase(fetchCustomerRestaurants.rejected, (state, action) => {
        state.loadingList = false
        state.error = action.payload
      })
      .addCase(fetchCustomerRestaurant.fulfilled, (state, action) => {
        state.detail = action.payload
      })
      .addCase(fetchCustomerRestaurantMenu.pending, (state) => {
        state.loadingMenu = true
        state.error = null
      })
      .addCase(fetchCustomerRestaurantMenu.fulfilled, (state, action) => {
        state.loadingMenu = false
        state.detail = action.payload?.restaurant || state.detail
        state.menu = action.payload?.categories || []
      })
      .addCase(fetchCustomerRestaurantMenu.rejected, (state, action) => {
        state.loadingMenu = false
        state.error = action.payload
      })
  },
})

export const { clearRestaurantError } = customerRestaurantsSlice.actions
export default customerRestaurantsSlice.reducer
