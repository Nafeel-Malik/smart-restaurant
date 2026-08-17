import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuItemApi';

const apiError = (err, fallback) => err.response?.data?.message || fallback;

export const fetchMenuItems = createAsyncThunk(
  'menuItems/fetchAll',
  async (categoryId, { rejectWithValue }) => {
    try {
      const res = await getMenuItems(categoryId);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to fetch menu items'));
    }
  }
);

export const createMenuItemThunk = createAsyncThunk('menuItems/create', async (data, { rejectWithValue }) => {
  try {
    const res = await createMenuItem(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to create menu item'));
  }
});

export const updateMenuItemThunk = createAsyncThunk(
  'menuItems/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateMenuItem(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update menu item'));
    }
  }
);

export const deleteMenuItemThunk = createAsyncThunk('menuItems/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteMenuItem(id);
    return id;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to delete menu item'));
  }
});

const menuItemSlice = createSlice({
  name: 'menuItems',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearMenuItemError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMenuItems.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchMenuItems.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createMenuItemThunk.fulfilled, (state, action) => { state.list.push(action.payload); state.error = null; })
      .addCase(createMenuItemThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateMenuItemThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateMenuItemThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteMenuItemThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteMenuItemThunk.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearMenuItemError } = menuItemSlice.actions;
export default menuItemSlice.reducer;
