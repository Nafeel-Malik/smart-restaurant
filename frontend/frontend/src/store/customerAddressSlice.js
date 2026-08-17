import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/customerAddressApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || fallback
}

export const fetchAddresses = createAsyncThunk(
  'customerAddresses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAddresses()
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load addresses'))
    }
  }
)

export const addAddress = createAsyncThunk(
  'customerAddresses/add',
  async (data, { rejectWithValue }) => {
    try {
      const res = await createAddress(data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to add address'))
    }
  }
)

export const updateAddressThunk = createAsyncThunk(
  'customerAddresses/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateAddress(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update address'))
    }
  }
)

export const deleteAddressThunk = createAsyncThunk(
  'customerAddresses/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteAddress(id)
      return id
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to delete address'))
    }
  }
)

export const setDefaultAddressThunk = createAsyncThunk(
  'customerAddresses/setDefault',
  async (id, { rejectWithValue }) => {
    try {
      const res = await setDefaultAddress(id)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to set default address'))
    }
  }
)

const customerAddressSlice = createSlice({
  name: 'customerAddresses',
  initialState: {
    list: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAddressError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addAddress.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.saving = false
        if (action.payload.isDefault) {
          state.list = state.list.map((a) => ({ ...a, isDefault: false }))
        }
        state.list.unshift(action.payload)
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(updateAddressThunk.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateAddressThunk.fulfilled, (state, action) => {
        state.saving = false
        const updated = action.payload
        if (updated.isDefault) {
          state.list = state.list.map((a) => ({
            ...a,
            isDefault: a._id === updated._id,
          }))
        }
        const idx = state.list.findIndex((a) => a._id === updated._id)
        if (idx !== -1) state.list[idx] = updated
      })
      .addCase(updateAddressThunk.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(deleteAddressThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a._id !== action.payload)
        state.error = null
      })
      .addCase(deleteAddressThunk.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(setDefaultAddressThunk.fulfilled, (state, action) => {
        const updated = action.payload
        state.list = state.list
          .map((a) => ({
            ...a,
            isDefault: a._id === updated._id,
          }))
          .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        state.error = null
      })
      .addCase(setDefaultAddressThunk.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearAddressError } = customerAddressSlice.actions
export default customerAddressSlice.reducer
