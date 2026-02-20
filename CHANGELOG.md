# 📝 Feisty Bot - Changelog

## v2.1.0 - Competitor-Ready Update 🚀

### ✅ New Features (Competitor-Level)

#### 1. **Multi-User Admin System** 👥
- Role-based access control (Owner, Manager, Staff)
- Multiple admin users support
- Username/password authentication
- Session management with role information
- Enhanced security with password hashing

#### 2. **Inventory Management** 📦
- Stock tracking for menu items
- Low stock alerts
- Auto-reduce stock on order placement
- Min/max stock level configuration
- Real-time inventory dashboard

#### 3. **Customer Loyalty Program** 🎁
- Points system (1 point per 1000 IDR)
- Tier levels: Bronze, Silver, Gold, Platinum
- Automatic tier upgrades based on total spending
- Points tracking and redemption
- Customer loyalty dashboard

#### 4. **Advanced Analytics Dashboard** 📊
- Today's orders and revenue
- Monthly/yearly statistics
- Top selling items analysis
- Order status breakdown
- Customer and loyalty member counts
- Low stock alerts integration

#### 5. **Order Tracking** 🔍
- Customer-facing order status tracking
- Public API endpoint for order lookup
- Real-time order status updates
- Track order via order ID

#### 6. **PWA Support** 📱
- Progressive Web App manifest
- Service worker for offline support
- Offline page fallback
- Push notification support
- Installable on mobile devices
- Cache-first strategy

---

### 🔧 New API Functions

#### Admin Users
- `getAllAdminUsers()` - Get all admin users
- `addAdminUser(data)` - Add new admin user
- `updateAdminUser(row, data)` - Update admin user
- `deleteAdminUser(row)` - Delete admin user
- `adminLoginMulti(username, password)` - Multi-user login
- `hasRole(role)` - Role-based access check

#### Inventory
- `getInventory()` - Get all inventory items
- `addInventoryItem(data)` - Add inventory item
- `updateInventoryItem(row, data)` - Update inventory
- `deleteInventoryItem(row)` - Delete inventory item
- `reduceStock(items)` - Auto-reduce stock on order
- `getLowStockAlerts()` - Get low stock alerts

#### Loyalty
- `getLoyaltyPoints(phone)` - Get customer loyalty
- `addLoyaltyPoints(phone, nama, total)` - Add points
- `useLoyaltyPoints(phone, points)` - Use/redeem points
- `getAllLoyaltyMembers()` - Get all loyalty members

#### Analytics & Tracking
- `getAnalyticsDashboard()` - Get all analytics data
- `trackOrder(orderId)` - Track order status

---

### 📊 New Google Sheets

#### Admin_Users Sheet
| Column | Type |
|--------|------|
| username | string |
| password_hash | string |
| role | string (owner/manager/staff) |
| nama_lengkap | string |
| email | string |
| aktif | boolean |
| created_at | date |
| last_login | date |

#### Inventory Sheet
| Column | Type |
|--------|------|
| menu_id | string |
| nama_menu | string |
| stok | number |
| satuan | string |
| stok_min | number |
| stok_max | number |
| updated_at | date |

#### Loyalty_Points Sheet
| Column | Type |
|--------|------|
| phone | string |
| nama | string |
| total_poin | number |
| total_pemesanan | number |
| total_belanja | number |
| poin_dipakai | number |
| tier | string |
| created_at | date |
| updated_at | date |

---

### 🆕 New Files

- `manifest.json` - PWA manifest
- `sw.js` - Service worker
- `offline.html` - Offline fallback page

---

### ✅ v2.0.0 - Major Security & Performance Update ✨

### ✅ Completed Features

#### 1. **Admin Authentication & Authorization** 🔐
- ✅ Admin login form dengan password validation
- ✅ Token-based session (2-hour expiry)
- ✅ Server-side token verification untuk semua admin actions
- ✅ Protected admin endpoints di GAS backend

#### 2. **Security & Secrets Management** 🛡️
- ✅ All API keys moved to CONFIG sheet (server-side storage)
- ✅ No sensitive data exposed in client code
- ✅ Keys read dynamically via `getAPIKey()` function
- ✅ Support for: Gemini, Midtrans, Stripe, Whacenter, Email

#### 3. **Input Validation & Sanitization** ✔️
- ✅ Server-side input validation (GAS)
- ✅ Sanitization functions: `sanitizeString()`, `sanitizePhoneNumber()`, etc.
- ✅ Price validation, phone validation, email validation
- ✅ Menu & order data validators
- ✅ XSS & injection prevention

#### 4. **Payment Gateway Integration** 💳
- ✅ Midtrans server-side payment creation
- ✅ Stripe server-side payment creation  
- ✅ Payment endpoints: `createPaymentMidtrans`, `createPaymentStripe`
- ✅ Client integration with payment redirect flow
- ✅ Order ID & customer email tracking

#### 5. **Logging & Monitoring** 📊
- ✅ Logs sheet for activity tracking
- ✅ `logActivity()` function for event recording
- ✅ Activity types: ORDER, WA, EMAIL, PAYMENT, ADMIN_ACTION
- ✅ Email notification support via `sendEmailNotification()`
- ✅ Retry logic with exponential backoff

#### 6. **UX & Mobile Improvements** 📱
- ✅ Cart persistence to localStorage
- ✅ Auto-restore cart on page reload
- ✅ Added email field for payment notifications
- ✅ Mobile-responsive forms & layout
- ✅ Smooth transitions & error handling

#### 7. **Performance & SEO** ⚡
- ✅ Image lazy loading (`loading="lazy"`)
- ✅ Error fallback for broken images
- ✅ Config-driven metadata
- ✅ Optimized DB queries
- ✅ Efficient logging with row limit (1000 max)

---

## 🔧 API Changes

### New GAS Functions

#### Admin Auth
- `adminLogin(password)` - Create admin session & token
- `verifyAdminToken(token)` - Validate token authenticity

#### Config Management  
- `getCustomConfig()` - Read CONFIG sheet
- `saveCustomConfigObj(obj)` - Write to CONFIG sheet
- `getAPIKey(keyName, fallback)` - Read API keys dynamically

#### Input Sanitization
- `sanitizeString(str, maxLength)` - Remove dangerous chars
- `sanitizePhoneNumber(phone)` - Normalize phone to 62XXXXXXXXX
- `validateEmail(email)` - Email format validation
- `validatePhone(phone)` - Phone length validation
- `validatePrice(price)` - Price range validation
- `validateMenuData(data)` - Menu validation
- `validateOrderData(data)` - Order validation

#### Payment (New)
- `createMidtransPayment(orderId, amount, email, phone)` - Create Midtrans session
- `createStripePayment(orderId, amount, email)` - Create Stripe session
- `flattenObject(prefix, obj)` - Helper for FormData

#### Logging (New)
- `logActivity(type, action, details, status, error)` - Log events
- `sendEmailNotification(subject, message, recipient)` - Email alerts
- `retryFetch(url, options, maxRetries)` - Fetch with retry

#### Utilities
- `initLogsSheet()` - Setup logs sheet on demand

### New GAS Endpoints

#### Public Endpoints
- `POST /createPaymentMidtrans` - Create payment transaction
- `POST /createPaymentStripe` - Create Stripe session
- `GET /adminGetAll?admin_token=TOKEN` - Get all data (auth required)

#### Admin Endpoints (Require `admin_token`)
- `POST /saveCustomConfig` - Save config
- `POST /addMenuItem`, `/updateMenuItem`, `/deleteMenu` - Menu management
- `POST /addKnowledge`, `/deleteKnowledge` - Knowledge management
- `POST /saveSettings` - Settings update
- `POST /updateOrderStatus` - Order status update

---

## 📊 Google Sheets - New Structure

### New Sheet: CONFIG
| Column | Type | Example |
|--------|------|---------|
| Key | string | `admin_password` |
| Value | string | `changeme123` |
| UpdatedAt | date | 2026-02-20 |

**Default Rows:**
- `admin_password` - Admin login password
- `gemini_key` - Gemini API key
- `whatsapp_url` - WhatsApp API endpoint
- `whatsapp_device_id` - Device ID
- `midtrans_key` - Midtrans server key
- `stripe_key` - Stripe secret key
- `base_url` - Website base URL
- `maintenance_mode` - Service status (true/false)

### New Sheet: Logs
| Column | Type | Purpose |
|--------|------|---------|
| Timestamp | date | When action occurred |
| Type | string | ORDER, WA, EMAIL, ADMIN, PAYMENT |
| Action | string | Specific action (create, send, update) |
| Details | string | Order ID, customer name, etc. |
| Status | string | success / failed / pending |
| Error | string | Error message if failed |

---

## 🚀 Deployment Steps

1. **Update Google Apps Script**
   - Copy new GAS code with all new functions
   - Deploy as Web App (anyone access)
   - Note the deployment URL

2. **Add CONFIG Sheet**
   - Create "CONFIG" sheet in Spreadsheet
   - Add header row: Key, Value, UpdatedAt
   - Add API key rows (or run `setupSheets()`)

3. **Update Frontend Config**
   - Update `GAS_URL` in `config.js`
   - Verify all HTML files include `<script src="config.js"></script>`

4. **Configure API Keys**
   - Fill in CONFIG sheet with actual keys:
     - Gemini API key
     - Midtrans/Stripe keys (if using)
     - Whacenter credentials
   - Set `admin_password` to secure value

5. **Test Admin Login**
   - Open `admin.html`
   - Login with password from CONFIG sheet
   - Verify admin panel loads

6. **Test Payment Flow**
   - Create order with "Card" payment method
   - Verify Midtrans/Stripe redirect works
   - Check order logged in Orders sheet

---

## 🐛 Bug Fixes

- Fixed multiple GEMINI_API_KEY references using config
- Fixed admin token validation in all protected endpoints
- Fixed phone number normalization in orders
- Fixed menu image alt text for accessibility
- Fixed cart persistence across page reloads

---

## ⚠️ Breaking Changes

- **Removed** hardcoded `GEMINI_API_KEY`, `DEVICE_ID` from GAS code
- **Removed** client-side API key storage
- **Renamed** some helper functions for clarity
- **Changed** doGet/doPost signature slightly for token handling

---

## 📚 Documentation

- Updated `SETUP.md` with full deployment guide
- Added security best practices
- Added payment integration guide
- Added logging & monitoring guide

---

## 🎯 Next Steps (v2.1 Roadmap)

- [ ] Multi-user admin support (per-user roles)
- [ ] 2FA (Two Factor Authentication)
- [ ] Webhook signature verification
- [ ] Advanced analytics dashboard
- [ ] Inventory tracking
- [ ] SMS notifications
- [ ] Automated backup
- [ ] Advanced error reporting

---

## 👤 Contributors

- **Feisty Dev Team** - Security & feature implementation

---

**Release Date:** February 20, 2026  
**Stability:** 🟢 Production Ready
