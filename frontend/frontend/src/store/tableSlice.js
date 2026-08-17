import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getTables, createTable, updateTable, deleteTable, assignTableWaiter } from '../services/tableApi';
import { fetchWaiters } from './waiterSlice';

const apiError = (err, fallback) => err.response?.data?.message || fallback;

export const fetchTables = createAsyncThunk('tables/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getTables();
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to fetch tables'));
  }
});

export const createTableThunk = createAsyncThunk('tables/create', async (data, { rejectWithValue }) => {
  try {
    const res = await createTable(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to create table'));
  }
});

export const updateTableThunk = createAsyncThunk(
  'tables/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateTable(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update table'));
    }
  }
);

export const deleteTableThunk = createAsyncThunk('tables/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteTable(id);
    return id;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to delete table'));
  }
});

export const assignTableWaiterThunk = createAsyncThunk(
  'tables/assignWaiter',
  async ({ tableId, waiterId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignTableWaiter(tableId, waiterId);
      dispatch(fetchWaiters());
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to assign waiter'));
    }
  }
);

const tableSlice = createSlice({
  name: 'tables',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearTableError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTables.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchTables.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTableThunk.fulfilled, (state, action) => { state.list.push(action.payload); state.error = null; })
      .addCase(createTableThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateTableThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateTableThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteTableThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTableThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(assignTableWaiterThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(assignTableWaiterThunk.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearTableError } = tableSlice.actions;
export default tableSlice.reducer;
