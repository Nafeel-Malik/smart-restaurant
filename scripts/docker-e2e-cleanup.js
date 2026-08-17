/**
 * Delete Docker E2E test artefacts from a MongoDB database.
 * Targets only records created by scripts/docker-e2e-test.mjs naming patterns.
 *
 * Set E2E_MONGO_DB (default: smart_restaurant) before piping to mongosh.
 * Example: E2E_MONGO_DB=smart_restaurant_e2e
 */
const dbName = typeof E2E_MONGO_DB !== 'undefined' ? E2E_MONGO_DB : 'smart_restaurant';
const target = db.getSiblingDB(dbName);

const e2eRestaurants = target.restaurants.find({ name: /^Docker E2E/i }).toArray();
const e2eRestaurantIds = e2eRestaurants.map((r) => r._id);

const e2eManagers = target.users.find({ username: /^e2e_mgr_/ }).toArray();
const e2eManagerIds = e2eManagers.map((u) => u._id);

const e2eCustomers = target.customers
  .find({ email: /^docker_e2e_.*@test\.com$/i })
  .toArray();
const e2eCustomerIds = e2eCustomers.map((c) => c._id);

const summary = {
  db: dbName,
  found: {
    restaurants: e2eRestaurants.map((r) => ({ _id: String(r._id), name: r.name })),
    managers: e2eManagers.map((u) => ({ _id: String(u._id), username: u.username })),
    customers: e2eCustomers.map((c) => ({ _id: String(c._id), email: c.email })),
  },
};

if (e2eRestaurantIds.length) {
  summary.ordersByRestaurant = target.orders.deleteMany({
    restaurantId: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.reservationsByRestaurant = target.reservations.deleteMany({
    restaurantId: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.reviewsByRestaurant = target.reviews.deleteMany({
    restaurantId: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.favoriteRestaurants = target.favoriterestaurants.deleteMany({
    restaurantId: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.favoriteFoods = target.favoritefoods.deleteMany({
    restaurantId: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.tables = target.tables.deleteMany({
    restaurant: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.waiters = target.waiters.deleteMany({
    restaurant: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.chefs = target.chefs.deleteMany({
    restaurant: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.menuitems = target.menuitems.deleteMany({
    restaurant: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.categories = target.categories.deleteMany({
    restaurant: { $in: e2eRestaurantIds },
  }).deletedCount;
  summary.restaurants = target.restaurants.deleteMany({
    _id: { $in: e2eRestaurantIds },
  }).deletedCount;
}

if (e2eCustomerIds.length) {
  summary.ordersByCustomer = target.orders.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.reservationsByCustomer = target.reservations.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.reviewsByCustomer = target.reviews.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.addresses = target.addresses.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.otps = target.otps.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.favoriteRestaurantsByCustomer = target.favoriterestaurants.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.favoriteFoodsByCustomer = target.favoritefoods.deleteMany({
    customerId: { $in: e2eCustomerIds },
  }).deletedCount;
  summary.customers = target.customers.deleteMany({
    _id: { $in: e2eCustomerIds },
  }).deletedCount;
}

if (e2eManagerIds.length) {
  summary.managers = target.users.deleteMany({
    _id: { $in: e2eManagerIds },
  }).deletedCount;
}

print(JSON.stringify(summary));
