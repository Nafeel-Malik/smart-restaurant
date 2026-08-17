import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getFavoriteRestaurants,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  checkFavoriteRestaurant,
  getFavoriteFood,
  addFavoriteFood,
  removeFavoriteFood,
  checkFavoriteFood,
} from '../services/customerFavoritesApi'

const apiError = (err, fallback) => {
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || fallback
}

export const refId = (ref) => {
  if (!ref) return ''
  if (typeof ref === 'object') return String(ref._id || ref.id || '')
  return String(ref)
}

export const selectIsRestaurantFavorited = (state, restaurantId) => {
  const id = String(restaurantId || '')
  if (!id) return false
  const { restaurantStatus, restaurants } = state.customerFavorites
  if (Object.prototype.hasOwnProperty.call(restaurantStatus, id)) {
    return restaurantStatus[id]
  }
  return restaurants.some((fav) => refId(fav.restaurantId) === id)
}

export const selectIsFoodFavorited = (state, foodId) => {
  const id = String(foodId || '')
  if (!id) return false
  const { foodStatus, food } = state.customerFavorites
  if (Object.prototype.hasOwnProperty.call(foodStatus, id)) {
    return foodStatus[id]
  }
  return food.some((fav) => refId(fav.foodId) === id)
}

export const fetchFavoriteRestaurants = createAsyncThunk(
  'customerFavorites/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFavoriteRestaurants()
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load favorite restaurants'))
    }
  }
)

export const fetchFavoriteFood = createAsyncThunk(
  'customerFavorites/fetchFood',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFavoriteFood()
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to load favorite food'))
    }
  }
)

export const checkRestaurantFavorite = createAsyncThunk(
  'customerFavorites/checkRestaurant',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await checkFavoriteRestaurant(restaurantId)
      return { restaurantId, isFavorite: Boolean(res.data?.isFavorite) }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to check restaurant favorite'))
    }
  }
)

export const checkFoodFavorite = createAsyncThunk(
  'customerFavorites/checkFood',
  async (foodId, { rejectWithValue }) => {
    try {
      const res = await checkFavoriteFood(foodId)
      return { foodId, isFavorite: Boolean(res.data?.isFavorite) }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to check food favorite'))
    }
  }
)

export const toggleFavoriteRestaurant = createAsyncThunk(
  'customerFavorites/toggleRestaurant',
  async (restaurantId, { getState, rejectWithValue }) => {
    const favorited = selectIsRestaurantFavorited(getState(), restaurantId)
    try {
      if (favorited) {
        await removeFavoriteRestaurant(restaurantId)
        return { restaurantId, favorited: false }
      }
      const res = await addFavoriteRestaurant(restaurantId)
      return { restaurantId, favorited: true, item: res.data }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update restaurant favorite'))
    }
  }
)

export const toggleFavoriteFood = createAsyncThunk(
  'customerFavorites/toggleFood',
  async (foodId, { getState, rejectWithValue }) => {
    const favorited = selectIsFoodFavorited(getState(), foodId)
    try {
      if (favorited) {
        await removeFavoriteFood(foodId)
        return { foodId, favorited: false }
      }
      const res = await addFavoriteFood(foodId)
      return { foodId, favorited: true, item: res.data }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Failed to update food favorite'))
    }
  }
)

const customerFavoritesSlice = createSlice({
  name: 'customerFavorites',
  initialState: {
    restaurants: [],
    food: [],
    restaurantStatus: {},
    foodStatus: {},
    loadingRestaurants: false,
    loadingFood: false,
    togglingRestaurantId: null,
    togglingFoodId: null,
    error: null,
  },
  reducers: {
    clearFavoritesError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoriteRestaurants.pending, (state) => {
        state.loadingRestaurants = true
        state.error = null
      })
      .addCase(fetchFavoriteRestaurants.fulfilled, (state, action) => {
        state.loadingRestaurants = false
        state.restaurants = action.payload || []
        state.restaurantStatus = Object.fromEntries(
          state.restaurants.map((fav) => [refId(fav.restaurantId), true])
        )
      })
      .addCase(fetchFavoriteRestaurants.rejected, (state, action) => {
        state.loadingRestaurants = false
        state.error = action.payload
      })
      .addCase(fetchFavoriteFood.pending, (state) => {
        state.loadingFood = true
        state.error = null
      })
      .addCase(fetchFavoriteFood.fulfilled, (state, action) => {
        state.loadingFood = false
        state.food = action.payload || []
        state.foodStatus = Object.fromEntries(
          state.food.map((fav) => [refId(fav.foodId), true])
        )
      })
      .addCase(fetchFavoriteFood.rejected, (state, action) => {
        state.loadingFood = false
        state.error = action.payload
      })
      .addCase(checkRestaurantFavorite.fulfilled, (state, action) => {
        state.restaurantStatus[action.payload.restaurantId] = action.payload.isFavorite
      })
      .addCase(checkFoodFavorite.fulfilled, (state, action) => {
        state.foodStatus[action.payload.foodId] = action.payload.isFavorite
      })
      .addCase(toggleFavoriteRestaurant.pending, (state, action) => {
        state.togglingRestaurantId = action.meta.arg
        state.error = null
      })
      .addCase(toggleFavoriteRestaurant.fulfilled, (state, action) => {
        const { restaurantId, favorited, item } = action.payload
        state.togglingRestaurantId = null
        state.restaurantStatus[restaurantId] = favorited
        if (favorited) {
          if (item && !state.restaurants.some((fav) => refId(fav.restaurantId) === restaurantId)) {
            state.restaurants.unshift(item)
          }
        } else {
          state.restaurants = state.restaurants.filter((fav) => refId(fav.restaurantId) !== restaurantId)
        }
      })
      .addCase(toggleFavoriteRestaurant.rejected, (state, action) => {
        state.togglingRestaurantId = null
        state.error = action.payload
      })
      .addCase(toggleFavoriteFood.pending, (state, action) => {
        state.togglingFoodId = action.meta.arg
        state.error = null
      })
      .addCase(toggleFavoriteFood.fulfilled, (state, action) => {
        const { foodId, favorited, item } = action.payload
        state.togglingFoodId = null
        state.foodStatus[foodId] = favorited
        if (favorited) {
          if (item && !state.food.some((fav) => refId(fav.foodId) === foodId)) {
            state.food.unshift(item)
          }
        } else {
          state.food = state.food.filter((fav) => refId(fav.foodId) !== foodId)
        }
      })
      .addCase(toggleFavoriteFood.rejected, (state, action) => {
        state.togglingFoodId = null
        state.error = action.payload
      })
  },
})

export const { clearFavoritesError } = customerFavoritesSlice.actions
export default customerFavoritesSlice.reducer
