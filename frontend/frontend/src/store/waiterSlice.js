import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getWaiters, createWaiter, updateWaiter, deleteWaiter } from '../services/waiterApi';

const apiError = (err, fallback) => err.response?.data?.message || fallback;

export const fetchWaiters = createAsyncThunk('waiters/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getWaiters();
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to fetch waiters'));
  }
});

export const createWaiterThunk = createAsyncThunk('waiters/create', async (data, { rejectWithValue }) => {
  try {
    const res = await createWaiter(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to create waiter'));
  }
});

export const updateWaiterThunk = createAsyncThunk(
  'waiters/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateWaiter(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update waiter'));
    }
  }
);

export const deleteWaiterThunk = createAsyncThunk('waiters/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteWaiter(id);
    return id;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to delete waiter'));
  }
});

const waiterSlice = createSlice({
  name: 'waiters',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearWaiterError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWaiters.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWaiters.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchWaiters.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createWaiterThunk.fulfilled, (state, action) => { state.list.push(action.payload); state.error = null; })
      .addCase(createWaiterThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateWaiterThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((w) => w._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateWaiterThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteWaiterThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((w) => w._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteWaiterThunk.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearWaiterError } = waiterSlice.actions;
export default waiterSlice.reducer;
