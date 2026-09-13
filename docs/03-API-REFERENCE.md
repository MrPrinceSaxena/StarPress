# API Reference

No API routes exist yet — this file is scaffolded now and filled in phase-by-phase as
routes are built. **Every route added must get an entry here in the same phase.**

## Format for each entry
```
### METHOD /api/path
**Auth:** none / customer / admin
**Purpose:** one line
**Request body:** { field: type, ... }
**Response:** { field: type, ... }
**Errors:** notable error cases
```

## Planned routes by phase (not yet built)
- **Phase 1 (Auth):** `POST /api/auth/register`, `/api/auth/login`,
  NextAuth session routes
- **Phase 2 (Catalog):** `GET /api/categories`, `GET /api/products`,
  `GET /api/products/[slug]`
- **Phase 3 (Cart/Checkout):** `GET /api/cart`, `POST /api/cart/items`,
  `DELETE /api/cart/items/[id]`
- **Phase 4 (Orders):** `POST /api/orders`, `GET /api/orders/[id]`,
  `GET /api/admin/orders`
- **Phase 5 (Payments):** `POST /api/payments/create-order`,
  `POST /api/payments/webhook`
- **Phase 6 (Admin):** `POST/PATCH/DELETE /api/admin/products`,
  `POST/PATCH/DELETE /api/admin/categories`
