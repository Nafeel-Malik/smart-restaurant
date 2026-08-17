import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getManagers, createManager, assignManager, unassignManager, updateManager, deleteManager } from '../services/managerApi';
import { fetchRestaurants } from './restaurantSlice';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchManagers = createAsyncThunk(
  'managers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getManagers();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch managers'
      );
    }
  }
);

export const createManagerThunk = createAsyncThunk(
  'managers/create',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await createManager(data);
      if (data?.restaurantId) {
        dispatch(fetchRestaurants());
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create manager'
      );
    }
  }
);

export const assignManagerThunk = createAsyncThunk(
  'managers/assign',
  async ({ restaurantId, managerId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await assignManager(restaurantId, managerId);
      // Refetch managers and restaurants to synchronize the UI
      dispatch(fetchManagers());
      dispatch(fetchRestaurants());
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to assign manager'
      );
    }
  }
);

export const unassignManagerThunk = createAsyncThunk(
  'managers/unassign',
  async (restaurantId, { dispatch, rejectWithValue }) => {
    try {
      const res = await unassignManager(restaurantId);
      // Refetch managers and restaurants to synchronize the UI
      dispatch(fetchManagers());
      dispatch(fetchRestaurants());
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to unassign manager'
      );
    }
  }
);

export const updateManagerThunk = createAsyncThunk(
  'managers/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateManager(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update manager'
      );
    }
  }
);

export const deleteManagerThunk = createAsyncThunk(
  'managers/delete',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await deleteManager(id);
      dispatch(fetchRestaurants());
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete manager'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const managerSlice = createSlice({
  name: 'managers',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearManagerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchManagers
    builder
      .addCase(fetchManagers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createManagerThunk
    builder
      .addCase(createManagerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManagerThunk.fulfilled, (state, action) => {
        state.loading = false;
        const newManager = action.payload.user || action.payload;
        state.list.push(newManager);
      })
      .addCase(createManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // assignManagerThunk
    builder
      .addCase(assignManagerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignManagerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(assignManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // unassignManagerThunk
    builder
      .addCase(unassignManagerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignManagerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(unassignManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateManagerThunk
    builder
      .addCase(updateManagerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateManagerThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.user || action.payload;
        const idx = state.list.findIndex((m) => m._id === updated._id);
        if (idx !== -1) {
          state.list[idx] = updated;
        }
      })
      .addCase(updateManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // deleteManagerThunk
    builder
      .addCase(deleteManagerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManagerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteManagerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearManagerError } = managerSlice.actions;
export default managerSlice.reducer;
