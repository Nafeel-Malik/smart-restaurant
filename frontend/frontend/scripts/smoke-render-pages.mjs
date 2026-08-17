/**
 * Smoke-test: render every page component once to catch ReferenceError
 * (e.g. missing hook imports) before manual QA.
 *
 * Run: npx vite-node scripts/smoke-render-pages.mjs
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'

// Mock browser storage before any slice modules load.
const memoryStore = {}
globalThis.localStorage = {
  getItem: (key) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key, value) => {
    memoryStore[key] = String(value)
  },
  removeItem: (key) => {
    delete memoryStore[key]
  },
  clear: () => {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k])
  },
}

const fakeCustomer = {
  id: '000000000000000000000099',
  fullName: 'Smoke Test',
  email: 'smoke@test.com',
  phone: '+923009999999',
  role: 'customer',
}

const fakeStaffUser = {
  id: '000000000000000000000088',
  username: 'smoke_admin',
  role: 'super_admin',
  assignedRestaurant: null,
}

localStorage.setItem('customerToken', 'smoke-token')
localStorage.setItem('customer', JSON.stringify(fakeCustomer))
localStorage.setItem('token', 'smoke-token')
localStorage.setItem('user', JSON.stringify(fakeStaffUser))
localStorage.setItem(
  'customerCart',
  JSON.stringify({
    restaurantId: '6a7972f7e4f3f654efb35dd7',
    restaurantName: 'Smoke Restaurant',
    restaurantCurrency: 'PKR',
    items: [],
  }),
)

const { store } = await import('../src/store/store.js')

const pages = [
  ['CustomerDashboard', () => import('../src/pages/CustomerDashboard.jsx')],
  ['CustomerRestaurants', () => import('../src/pages/CustomerRestaurants.jsx')],
  ['CustomerRestaurantMenu', () => import('../src/pages/CustomerRestaurantMenu.jsx')],
  ['CustomerCart', () => import('../src/pages/CustomerCart.jsx')],
  ['CustomerOrders', () => import('../src/pages/CustomerOrders.jsx')],
  ['CustomerOrderDetail', () => import('../src/pages/CustomerOrderDetail.jsx')],
  ['CustomerReservationsPage', () => import('../src/pages/CustomerReservationsPage.jsx')],
  ['CustomerReservationDetail', () => import('../src/pages/CustomerReservationDetail.jsx')],
  ['CustomerReservationPage', () => import('../src/pages/CustomerReservationPage.jsx')],
  ['CustomerPreOrderPage', () => import('../src/pages/CustomerPreOrderPage.jsx')],
  ['CustomerFavorites', () => import('../src/pages/CustomerFavorites.jsx')],
  ['CustomerAddresses', () => import('../src/pages/CustomerAddresses.jsx')],
  ['CustomerProfile', () => import('../src/pages/CustomerProfile.jsx')],
  ['CustomerMyReviewsPage', () => import('../src/pages/CustomerMyReviewsPage.jsx')],
  ['CustomerActivityPage', () => import('../src/pages/CustomerActivityPage.jsx')],
  ['BranchManagerDashboard', () => import('../src/pages/BranchManagerDashboard.jsx')],
  ['OrdersList', () => import('../src/pages/OrdersList.jsx')],
  ['ChefsList', () => import('../src/pages/ChefsList.jsx')],
  ['WaitersList', () => import('../src/pages/WaitersList.jsx')],
  ['TablesList', () => import('../src/pages/TablesList.jsx')],
  ['MenuItems', () => import('../src/pages/MenuItems.jsx')],
  ['MenuCategories', () => import('../src/pages/MenuCategories.jsx')],
  ['Settings', () => import('../src/pages/Settings.jsx')],
  ['SuperAdminDashboard', () => import('../src/pages/SuperAdminDashboard.jsx')],
  ['RestaurantsList', () => import('../src/pages/RestaurantsList.jsx')],
  ['ManagersList', () => import('../src/pages/ManagersList.jsx')],
  ['EmailSettingsPage', () => import('../src/pages/EmailSettingsPage.jsx')],
  ['AddEditRestaurant', () => import('../src/pages/AddEditRestaurant.jsx')],
  ['AssignManager', () => import('../src/pages/AssignManager.jsx')],
]

const routeParams = {
  CustomerRestaurantMenu: '/customer/restaurants/6a7972f7e4f3f654efb35dd7',
  CustomerOrderDetail: '/customer/orders/6a7972f7e4f3f654efb35dd7',
  CustomerReservationDetail: '/customer/reservations/6a7972f7e4f3f654efb35dd7',
  CustomerReservationPage: '/customer/restaurants/6a7972f7e4f3f654efb35dd7/reserve',
  CustomerPreOrderPage: '/customer/reservations/6a7972f7e4f3f654efb35dd7/pre-order',
  AddEditRestaurant: '/restaurants/new',
}

const failures = []

for (const [name, loader] of pages) {
  try {
    const mod = await loader()
    const Page = mod.default
    const path = routeParams[name] || '/'
    const tree = createElement(
      Provider,
      { store },
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '*', element: createElement(Page) }),
        ),
      ),
    )
    renderToStaticMarkup(tree)
    console.log(`OK  ${name}`)
  } catch (err) {
    const isRefError = err instanceof ReferenceError || /is not defined/.test(err?.message || '')
    failures.push({ name, message: err?.message || String(err), isRefError })
    console.error(`FAIL ${name}: ${err?.message || err}`)
  }
}

const refFailures = failures.filter((f) => f.isRefError)
if (refFailures.length) {
  console.error(`\n${refFailures.length} ReferenceError(s) — likely missing imports:`)
  refFailures.forEach((f) => console.error(`  ${f.name}: ${f.message}`))
  process.exit(1)
}

if (failures.length) {
  console.warn(`\n${failures.length} page(s) failed for non-import reasons (API/state), not counted as missing-import bugs`)
}

console.log(`\nAll ${pages.length} pages rendered without ReferenceError`)
