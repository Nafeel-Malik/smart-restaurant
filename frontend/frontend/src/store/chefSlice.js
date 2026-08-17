import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getChefs, createChef, updateChef, deleteChef } from '../services/chefApi';

const apiError = (err, fallback) => err.response?.data?.message || fallback;

export const fetchChefs = createAsyncThunk('chefs/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getChefs();
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to fetch chefs'));
  }
});

export const createChefThunk = createAsyncThunk('chefs/create', async (data, { rejectWithValue }) => {
  try {
    const res = await createChef(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to create chef'));
  }
});

export const updateChefThunk = createAsyncThunk(
  'chefs/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateChef(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update chef'));
    }
  }
);

export const deleteChefThunk = createAsyncThunk('chefs/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteChef(id);
    return id;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to delete chef'));
  }
});

const chefSlice = createSlice({
  name: 'chefs',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearChefError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChefs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchChefs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchChefs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createChefThunk.fulfilled, (state, action) => { state.list.push(action.payload); state.error = null; })
      .addCase(createChefThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateChefThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateChefThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteChefThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteChefThunk.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearChefError } = chefSlice.actions;
export default chefSlice.reducer;
