import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customerAuthReducer from './customerAuthSlice';
import customerAddressReducer from './customerAddressSlice';
import customerFavoritesReducer from './customerFavoritesSlice';
import customerRestaurantsReducer from './customerRestaurantsSlice';
import customerCartReducer from './customerCartSlice';
import customerOrdersReducer from './customerOrdersSlice';
import staffOrdersReducer from './orderSlice';
import restaurantReducer from './restaurantSlice';
import managerReducer from './managerSlice';
import chefReducer from './chefSlice';
import waiterReducer from './waiterSlice';
import tableReducer from './tableSlice';
import categoryReducer from './categorySlice';
import menuItemReducer from './menuItemSlice';
import emailSettingsReducer from './emailSettingsSlice';
import customerReservationsReducer from './customerReservationsSlice';
import customerActivityReducer from './customerActivitySlice';
import customerReviewsReducer from './customerReviewsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customerAuth: customerAuthReducer,
    customerAddresses: customerAddressReducer,
    customerFavorites: customerFavoritesReducer,
    customerRestaurants: customerRestaurantsReducer,
    customerCart: customerCartReducer,
    customerOrders: customerOrdersReducer,
    staffOrders: staffOrdersReducer,
    restaurants: restaurantReducer,
    managers: managerReducer,
    chefs: chefReducer,
    waiters: waiterReducer,
    tables: tableReducer,
    categories: categoryReducer,
    menuItems: menuItemReducer,
    emailSettings: emailSettingsReducer,
    customerReservations: customerReservationsReducer,
    customerActivity: customerActivityReducer,
    customerReviews: customerReviewsReducer,
  },
});

export default store;
