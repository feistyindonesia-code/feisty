## 📋 Feisty - Setup & Konfigurasi Lengkap

### ✨ Fitur Selesai

✅ **Landing Page** - Professional & response  
✅ **Order Page** - Dengan cart, checkout, & payment gateway  
✅ **Admin Panel** - Dashboard, menu, orders, customers, settings, knowledge base  
✅ **Admin Authentication** - Login dengan password, token session (2 jam)  
✅ **Custom Config** - Kelola API keys & settings dari admin  
✅ **API Keys Security** - Semua keys pindah ke CONFIG sheet (server-side)  
✅ **Input Validation & Sanitization** - Prevent SQL injection & XSS  
✅ **Payment Integration** - Midtrans & Stripe server-side  
✅ **Logging & Monitoring** - Activity logs & email notifications  
✅ **UX Improvements** - Cart persistence, mobile-friendly, lazy loading  
✅ **Performance** - Image lazy loading, error handling, retry logic  

---

## 📋 Struktur File

```
index.html                    → Landing page profesional
order.html                    → Halaman order/menu dengan checkout
admin.html                    → Panel admin lengkap dengan auth
config.js                     → File konfigurasi global (localStorage + server sync)
FEISTY_BOT_AI_MANAGED.gs      → Backend Google Apps Script (2300+ lines)
SETUP.md                      → Dokumentasi ini
```

---

## 🔐 Keamanan & Admin Auth

### Login Admin

1. Buka `admin.html` → akan muncul modal login
2. Masukkan password admin (default: `changeme123` dari CONFIG sheet)
3. Token disimpan di `sessionStorage` (otomatis clear saat browser tutup)
4. Token valid selama 2 jam

### Password Admin

- Ubah di Admin Panel → ⚙️ Settings → Konfigurasi Custom → "🔐 Admin Password"
- Password di-hash di server (jangan dikirim plain text)

---

## 🔑 API Keys Management

Semua API keys pindah ke CONFIG sheet, BUKAN di kode:

| Key | Lokasi Konfigurasi | Penggunaan |
|-----|------------------|-----------|
| `admin_password` | CONFIG Sheet | Admin panel login |
| `gemini_key` | CONFIG Sheet | AI message detection |
| `whatsapp_url` | CONFIG Sheet | Whacenter API |
| `whatsapp_device_id` | CONFIG Sheet | Whacenter auth |
| `midtrans_key` | CONFIG Sheet | Payment processing |
| `stripe_key` | CONFIG Sheet | Payment processing |
| `email_backend` | CONFIG Sheet | Email notifications |
| `base_url` | CONFIG Sheet | Redirect URLs |
| `maintenance_mode` | CONFIG Sheet | Service status |

**Setup:**
```
1. Buka Google Sheets → CONFIG sheet
2. Row 2-9 berisi template keys (Value masih kosong)
3. Isi value sesuai credentials masing-masing:
   - gemini_key: AIzaSy...
   - midtrans_key: Mid-...
   - stripe_key: sk_live_...
   - dst.
4. GAS otomatis membaca via getAPIKey() function
```

---

## 📊 Google Sheets Structure

### Sheets yang Digunakan

1. **Menu** - Daftar menu items (nama, harga, diskon, kategori, gambar, aktif)
2. **Orders** - Semua orders (tanggal, customer, items, total, status)
3. **Customers** - Customer data (phone, nama, alamat, diskon)
4. **Pengaturan** - Settings (shipping cost, QRIS fee, dll)
5. **CS_Pengetahuan** - Knowledge base untuk AI responses
6. **CONFIG** - API keys & custom settings (NEW - server-side)
7. **Logs** - Activity logging (orders, admin actions, errors)

---

## 🔧 Deployment Checklist

### Step 1: Setup Google Apps Script

```bash
1. Copy `FEISTY_BOT_AI_MANAGED.gs` ke Google Apps Script project
2. Buka Applications Script:
   - File > Project Settings
   - Catat scriptId (dalam URL)
3. Deploy sebagai Web App:
   - Deploy > New Deployment
   - Type: Web app
   - Execute as: Your Google account
   - Who has access: Anyone
   - Copy URL deployer hasil
4. URL format: https://script.google.com/macros/d/SCRIPT_ID/useweb
```

### Step 2: Update GAS_URL di Frontend

```javascript
// Di config.js, update:
FeistyConfig.GAS_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/useweb'
```

### Step 3: Setup Admin Password

```
1. GAS project → Run setup() function
2. Atau manual: Sheet CONFIG row 2 → admin_password = 'anda_pilih'
3. Note: Password dirubah di Admin Panel, tidak di kode
```

### Step 4: Konfigurasi API Keys

1. **Gemini API**
   ```
   1. Ke https://ai.google.dev/
   2. Create API key
   3. Paste ke CONFIG sheet -> gemini_key row
   ```

2. **Midtrans** (Optional)
   ```
   1. Dashboard: https://dashboard.midtrans.com
   2. Copy Server Key (Sandbox/Production)
   3. Paste ke CONFIG sheet -> midtrans_key
   ```

3. **Stripe** (Optional)
   ```
   1. Dashboard: https://dashboard.stripe.com
   2. Copy Secret Key (sk_live_... atau sk_test_...)
   3. Paste ke CONFIG sheet -> stripe_key
   ```

4. **Whacenter** (WhatsApp)
   ```
   1. Ke https://whacenter.com
   2. Update whatsapp_url & whatsapp_device_id di CONFIG sheet
   ```

### Struktur File

```
index.html          → Landing page profesional
order.html          → Halaman order/menu
admin.html          → Panel admin untuk kelola semua data
config.js           → File konfigurasi global (localStorage + server)
FEISTY_BOT_AI_MANAGED.gs → Backend Google Apps Script
```


## 🎯 Cara Setup & Menggunakan

### 1. **Update GAS_URL di Admin Panel**

```
1. Buka admin.html
2. Klik menu ⚙️ Settings
3. Pilih tab "⚙️ Konfigurasi Custom"
4. Update "Google Apps Script Webhook URL"
   Format: https://script.google.com/macros/d/YOUR_SCRIPT_ID/useweb
5. Klik "Simpan Konfigurasi Custom"
```

Setelah disimpan, URL akan tersimpan di:
- **localStorage** (untuk akses cepat di halaman dalam domain yang sama)
- **Google Sheets** (via GAS, untuk persistence & sharing)

### 2. **Semua Halaman Akan Menggunakan Konfigurasi Ini**

Setelah setup di admin panel:

✅ **index.html** (Landing) → Gunakan `FeistyConfig.GAS_URL`
✅ **order.html** (Order) → Gunakan `FeistyConfig.GAS_URL`
✅ **admin.html** (Admin) → Gunakan `FeistyConfig.GAS_URL`
✅ **Semua halaman** → Load otomatis dari `config.js`

---

## 🔐 Maintenance Mode

Aktifkan di Admin Panel untuk menutup semua layanan:

```
1. Settings → Konfigurasi Custom
2. Centang "🔴 Maintenance Mode"
3. Simpan

Hasil: Semua halaman kecuali admin.html akan menampilkan pesan maintenance
```

---

## 📊 Update Data Dari Admin Panel

### Pengaturan Toko (Tab 1: 🏪 Pengaturan Toko)
- Nama toko
- Admin WhatsApp
- Email toko
- Base shipping cost
- Operating hours
- Alamat toko
- Currency

**Disimpan ke:** `PENGATURAN` sheet di Spreadsheet

### Konfigurasi Custom (Tab 2: ⚙️ Konfigurasi Custom)
- GAS URL
- Spreadsheet ID
- API Keys (Gemini, WhatsApp, Midtrans, Stripe)
- Base URL
- Email Backend
- Admin Password
- Maintenance Mode

**Disimpan ke:** `CONFIG` sheet di Spreadsheet (jika ada) atau localStorage jika belum

---

## 🚀 Workflow

### Admin Update Konfigurasi:
```
1. Admin ke admin.html
2. Ubah config di Settings → Konfigurasi Custom
3. Klik "Simpan Konfigurasi Custom"
4. Data terkirim ke GAS (disimpan di Spreadsheet)
5. Halaman reload otomatis
```

### Pengguna Akses Website:
```
1. Buka index.html / order.html
2. Browser load config.js
3. config.js baca localStorage / fetch dari GAS
4. Semua API calls menggunakan GAS_URL dari config
```

---

## 💾 Local Storage Keys

Konfiurasi disimpan dengan prefix `feisty_`:

```javascript
localStorage.getItem('feisty_gas_url')
localStorage.getItem('feisty_spreadsheet_id')
localStorage.getItem('feisty_gemini_key')
localStorage.getItem('feisty_whatsapp_url')
localStorage.getItem('feisty_whatsapp_device_id')
localStorage.getItem('feisty_midtrans_key')
localStorage.getItem('feisty_stripe_key')
localStorage.getItem('feisty_base_url')
localStorage.getItem('feisty_email_backend')
localStorage.getItem('feisty_maintenance_mode')
```

**Untuk clear semua config:**
```javascript
// Di console browser
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('feisty_')) {
        localStorage.removeItem(key);
    }
}
```

---

## ⚠️ Backend (GAS) Function Requirements

Untuk mengelola config di GAS, tambahkan function ini di `FEISTY_BOT_AI_MANAGED.gs`:

```javascript
// Simpan custom config ke sheet
function saveCustomConfig(config) {
    const sheet = getSheet('CONFIG') || createSheet('CONFIG');
    sheet.clear();
    sheet.appendRow(['Key', 'Value', 'LastUpdated']);
    
    for (const [key, value] of Object.entries(config)) {
        sheet.appendRow([key, value, new Date()]);
    }
}

// Baca custom config dari sheet
function getCustomConfig() {
    const sheet = getSheet('CONFIG');
    if (!sheet) return {};
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    for (let i = 1; i < data.length; i++) {
        config[data[i][0]] = data[i][1];
    }
    return config;
}
```

---

## 🔄 Sinkronisasi Config

### Otomatis:
- Setiap kali halaman dimuat, `config.js` mencoba load dari GAS
- Jika gagal, gunakan value dari localStorage
- Jika tidak ada, gunakan default value

### Manual:
```javascript
// Di console
FeistyConfig.loadFromServer(); // Refresh dari server
FeistyConfig.updateAll(configObj); // Update local
FeistyConfig.getAll(); // Lihat semua config
```

---

## 🆘 Troubleshooting

### "GAS URL tidak valid"
✅ Pastikan URL dimulai dengan `https://script.google.com/macros/d/`
✅ Ganti `YOUR_GAS_SCRIPT_ID` dengan ID script Anda yang valid

### Config tidak tersimpan
✅ Cek localStorage quota browser
✅ Coba di mode private/incognito
✅ Cek network tab apakah GAS_URL accessible

### Halaman blank saat maintenance mode
✅ Buka admin.html untuk disable maintenance mode
✅ Atau clear localStorage dan reload

### Menu tidak muncul di landing
✅ Cek GAS_URL sudah benar di config
✅ Cek Spreadsheet ID sudah valid
✅ Cek Menu sheet ada data

---

## 📝 Checklist Setup Awal

- [ ] Update `GAS_URL` di admin.html → Settings → Konfigurasi Custom
- [ ] Input `SPREADSHEET_ID` 
- [ ] Input `GEMINI_KEY` (jika pakai AI validation)
- [ ] Input `WHATSAPP_DEVICE_ID`
- [ ] Input `BASE_URL` (domain website)
- [ ] Test landing page (index.html) - menu muncul?
- [ ] Test order page (order.html) - bisa add cart?
- [ ] Test admin panel (admin.html) - data muncul?

---

**Happy coding! 🚀**
