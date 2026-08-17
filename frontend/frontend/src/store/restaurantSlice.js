import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../services/restaurantApi';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getRestaurants();
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch restaurants'
      );
    }
  }
);

export const createRestaurantThunk = createAsyncThunk(
  'restaurants/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await createRestaurant(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create restaurant'
      );
    }
  }
);

export const updateRestaurantThunk = createAsyncThunk(
  'restaurants/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateRestaurant(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update restaurant'
      );
    }
  }
);

export const deleteRestaurantThunk = createAsyncThunk(
  'restaurants/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteRestaurant(id);
      return id; // return the deleted id so the reducer can remove it
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete restaurant'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRestaurantError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchRestaurants
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createRestaurantThunk
    builder
      .addCase(createRestaurantThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRestaurantThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
      })
      .addCase(createRestaurantThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateRestaurantThunk
    builder
      .addCase(updateRestaurantThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRestaurantThunk.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.list.findIndex(
          (r) => r._id === action.payload._id
        );
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateRestaurantThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // deleteRestaurantThunk
    builder
      .addCase(deleteRestaurantThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRestaurantThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteRestaurantThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRestaurantError } = restaurantSlice.actions;
export default restaurantSlice.reducer;
