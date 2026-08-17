import { createSlice } from '@reduxjs/toolkit'

const emptyCart = {
  restaurantId: null,
  restaurantName: '',
  restaurantCurrency: 'PKR',
  items: [],
}

const loadCart = () => {
  try {
    const raw = localStorage.getItem('customerCart')
    if (!raw) return { ...emptyCart }
    const parsed = JSON.parse(raw)
    return {
      ...emptyCart,
      restaurantId: parsed.restaurantId || null,
      restaurantName: parsed.restaurantName || '',
      restaurantCurrency: parsed.restaurantCurrency || 'PKR',
      items: Array.isArray(parsed.items) ? parsed.items : [],
    }
  } catch {
    return { ...emptyCart }
  }
}

const persist = (state) => {
  localStorage.setItem(
    'customerCart',
    JSON.stringify({
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName,
      restaurantCurrency: state.restaurantCurrency,
      items: state.items,
    })
  )
}

export const selectCartCount = (state) =>
  state.customerCart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

export const selectCartSubtotal = (state) =>
  Number(
    state.customerCart.items
      .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      .toFixed(2)
  )

const customerCartSlice = createSlice({
  name: 'customerCart',
  initialState: loadCart(),
  reducers: {
    addToCart: (state, action) => {
      const { restaurant, item } = action.payload
      if (!state.restaurantId || state.items.length === 0) {
        state.restaurantId = restaurant._id
        state.restaurantName = restaurant.name
        state.restaurantCurrency = restaurant.currency || 'PKR'
      }
      const existing = state.items.find((row) => row.foodId === item._id)
      if (existing) existing.quantity += 1
      else {
        state.items.push({
          foodId: item._id,
          name: item.name,
          price: Number(item.price),
          image: item.image || '',
          quantity: 1,
        })
      }
      persist(state)
    },
    replaceCartAndAdd: (state, action) => {
      const { restaurant, item } = action.payload
      state.restaurantId = restaurant._id
      state.restaurantName = restaurant.name
      state.restaurantCurrency = restaurant.currency || 'PKR'
      state.items = [
        {
          foodId: item._id,
          name: item.name,
          price: Number(item.price),
          image: item.image || '',
          quantity: 1,
        },
      ]
      persist(state)
    },
    updateQuantity: (state, action) => {
      const { foodId, quantity } = action.payload
      const item = state.items.find((row) => row.foodId === foodId)
      if (!item) return
      if (quantity < 1) {
        state.items = state.items.filter((row) => row.foodId !== foodId)
      } else {
        item.quantity = quantity
      }
      if (state.items.length === 0) {
        state.restaurantId = null
        state.restaurantName = ''
      }
      persist(state)
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((row) => row.foodId !== action.payload)
      if (state.items.length === 0) {
        state.restaurantId = null
        state.restaurantName = ''
      }
      persist(state)
    },
    clearCart: (state) => {
      state.restaurantId = null
      state.restaurantName = ''
      state.restaurantCurrency = 'PKR'
      state.items = []
      persist(state)
    },
  },
})

export const { addToCart, replaceCartAndAdd, updateQuantity, removeFromCart, clearCart } =
  customerCartSlice.actions
export default customerCartSlice.reducer
