# Nestfab

Direct-to-consumer store for Nestfab kitchenware and door guards. Customers can browse, check out, and pay here, alongside the existing Amazon, Flipkart, and Meesho listings.

## Architecture

```text
Browser
  Next.js storefront and admin   http://localhost:3001
        |
        | JSON
        v
  Node.js API                    http://localhost:4000
        |
        v
  PostgreSQL
```

The shop never trusts prices sent by the browser. The API reloads each product, applies the coupon, adds shipping, and reserves stock inside a database transaction. Online payments go through Razorpay. Until live keys are added, checkout uses a clearly labelled demo payment so the order flow can be tested.

## What is included

- Storefront: home, catalog, search, product pages, reviews, cart, guest checkout
- Payments: Razorpay, cash on delivery, and a local demo mode
- Accounts: register, sign in, saved addresses, order history
- Shipping rule: free above ₹999, otherwise ₹79. Prices are GST-inclusive
- Admin: revenue desk, products, categories, orders, coupons, customers, contact inbox
- Coupons in the seed data: `WELCOME10` (10% off) and `NEST50` (₹50 off orders of ₹499+)

## Run it

Docker Desktop has to be running.

```powershell
.\setup.ps1
npm run dev
```

- Shop: http://localhost:3001
- Admin: http://localhost:3001/admin
- API health: http://localhost:4000/api/health

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@nestfab.in | Nestfab@2026 |
| Customer | priya.shah@example.com | Customer@2026 |

Priya’s account already has a delivered order, so you can sign in and leave a review.

## Razorpay

Add test or live keys to `apps/api/.env`:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
DEMO_PAYMENTS=false
```

Point the Razorpay webhook at `https://<your-api>/api/payments/webhook` for `payment.captured`. Checkout also verifies the payment signature in the browser return path, so an order is confirmed even if the webhook is delayed.

With keys present, demo payment is disabled automatically.

## Environment

`apps/api/.env`

- `DATABASE_URL`
- `JWT_SECRET` (at least 16 characters)
- `PORT` (4000)
- `CORS_ORIGIN`
- Razorpay keys, optional
- `DEMO_PAYMENTS=true` only for local use

`apps/web/.env.local`

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3001`

## Useful commands

```powershell
npm run dev          # API and shop together
npm run test         # shipping and coupon calculations
npm run db:seed      # resets catalog, coupons, and demo users
```

Seeding wipes existing products, orders, and users and loads the sample catalogue again.

## Next production steps

Image files are URLs today. Move them to object storage before launch. Add email for order confirmation, a courier integration for tracking numbers, and GST invoice PDFs. Keep `DEMO_PAYMENTS` off, and replace the development `JWT_SECRET`.
