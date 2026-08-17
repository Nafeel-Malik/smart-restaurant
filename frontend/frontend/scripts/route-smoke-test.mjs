#!/usr/bin/env node
/**
 * Route smoke test — logs in via API, injects tokens, visits every portal route,
 * and reports blank screens / page errors.
 */
import { chromium } from 'playwright-core'

const BASE = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'
const API = process.env.VITE_API_URL || 'http://127.0.0.1:5001'
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function staffLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Staff login failed for ${username}: ${res.status}`)
  const data = await res.json()
  return { token: data.access_token, user: data.user }
}

async function customerLogin(email, password) {
  const res = await fetch(`${API}/customer/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`Customer login failed: ${body.message || res.status}`)
  }
  return res.json()
}

const SUPERADMIN_ROUTES = [
  '/dashboard',
  '/restaurants',
  '/managers',
  '/admin-orders',
  '/admin-settings',
]

const MANAGER_ROUTES = [
  '/branch',
  '/orders',
  '/chefs',
  '/waiters',
  '/tables',
  '/menu',
  '/categories',
  '/settings',
]

const CUSTOMER_ROUTES = [
  '/customer/dashboard',
  '/customer/restaurants',
  '/customer/restaurants/6a7972f7e4f3f654efb35dd7',
  '/customer/cart',
  '/customer/orders',
  '/customer/orders/000000000000000000000001',
  '/customer/reservations',
  '/customer/reservations/000000000000000000000001',
  '/customer/reservations/000000000000000000000001/pre-order',
  '/customer/favorites',
  '/customer/addresses',
  '/customer/profile',
  '/customer/reviews',
  '/customer/activity',
]

async function visitRoutes(page, routes, portal) {
  const results = []
  for (const path of routes) {
    const pageErrors = []
    const onError = (err) => pageErrors.push(String(err))
    page.on('pageerror', onError)

    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(800)

    const snapshot = await page.evaluate(() => {
      const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim()
      const hasErrorBoundary = bodyText.includes('Something went wrong') || bodyText.includes('Reload page')
      const hasLoaderOnly = bodyText === 'Loading RestoPro…' || bodyText.length < 8
      const hasMain = Boolean(
        document.querySelector('main') ||
          document.querySelector('[data-page-content]') ||
          document.querySelector('h1') ||
          document.querySelector('.font-headline-md'),
      )
      return {
        bodyLen: bodyText.length,
        bodyPreview: bodyText.slice(0, 120),
        hasErrorBoundary,
        hasLoaderOnly,
        hasMain,
        title: document.title,
      }
    })

    page.off('pageerror', onError)

    const blank =
      pageErrors.some((e) => /ReferenceError|usePageTitle|is not defined/i.test(e)) ||
      snapshot.hasErrorBoundary ||
      snapshot.hasLoaderOnly ||
      (!snapshot.hasMain && snapshot.bodyLen < 40)

    results.push({ portal, path, blank, pageErrors, snapshot })
    const status = blank ? 'BLANK/CRASH' : 'OK'
    console.log(`${status}  [${portal}] ${path}`)
    if (pageErrors.length) console.log('  errors:', pageErrors.join(' | '))
    if (blank && !pageErrors.length) console.log('  snapshot:', JSON.stringify(snapshot))
  }
  return results
}

async function injectStaffSession(page, token, user) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.removeItem('customerToken')
      localStorage.removeItem('customer')
    },
    { token, user },
  )
}

async function injectCustomerSession(page, token, customer) {
  await page.goto(`${BASE}/customer/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ token, customer }) => {
      localStorage.setItem('customerToken', token)
      localStorage.setItem('customer', JSON.stringify(customer))
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    { token, customer },
  )
}

async function main() {
  const admin = await staffLogin('admin', 'admin123')
  const manager = await staffLogin('e2e_manager', 'e2e123')

  let customerSession = null
  const customerEmail = process.env.E2E_CUSTOMER_EMAIL
  const customerPassword = process.env.E2E_CUSTOMER_PASSWORD
  if (customerEmail && customerPassword) {
    try {
      customerSession = await customerLogin(customerEmail, customerPassword)
    } catch (err) {
      console.warn(`Customer API login failed: ${err.message}`)
    }
  }

  if (!customerSession?.access_token) {
    customerSession = {
      access_token: 'smoke-customer-token',
      customer: {
        id: '000000000000000000000099',
        fullName: 'Route Smoke',
        email: 'smoke@test.com',
        phone: '+923009999999',
        role: 'customer',
      },
    }
    console.log('Using injected customer session for route smoke (set E2E_CUSTOMER_EMAIL/PASSWORD for live API)')
  }

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox'],
  })

  const allResults = []

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await injectStaffSession(page, admin.token, admin.user)
    allResults.push(...(await visitRoutes(page, SUPERADMIN_ROUTES, 'superadmin')))
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await injectStaffSession(page, manager.token, manager.user)
    allResults.push(...(await visitRoutes(page, MANAGER_ROUTES, 'manager')))
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await injectCustomerSession(page, customerSession.access_token, customerSession.customer)
    allResults.push(...(await visitRoutes(page, CUSTOMER_ROUTES, 'customer')))
    await page.close()
  }

  await browser.close()

  const failures = allResults.filter((r) => r.blank)
  console.log(`\n=== Summary: ${allResults.length - failures.length}/${allResults.length} routes OK ===`)
  if (failures.length) {
    console.log('Failures:')
    for (const f of failures) {
      console.log(`  [${f.portal}] ${f.path}`)
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
