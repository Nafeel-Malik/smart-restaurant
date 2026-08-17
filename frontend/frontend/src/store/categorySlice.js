import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryApi';

const apiError = (err, fallback) => err.response?.data?.message || fallback;

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await getCategories();
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to fetch categories'));
  }
});

export const createCategoryThunk = createAsyncThunk('categories/create', async (data, { rejectWithValue }) => {
  try {
    const res = await createCategory(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to create category'));
  }
});

export const updateCategoryThunk = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateCategory(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update category'));
    }
  }
);

export const deleteCategoryThunk = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteCategory(id);
    return id;
  } catch (err) {
    return rejectWithValue(apiError(err, 'Failed to delete category'));
  }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearCategoryError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCategoryThunk.fulfilled, (state, action) => { state.list.push(action.payload); state.error = null; })
      .addCase(createCategoryThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateCategoryThunk.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.error = null;
      })
      .addCase(updateCategoryThunk.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCategoryThunk.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
