# 🚀 Feisty Bot - Quick Start Guide

## 5 Menit Setup Guide

### 1️⃣ Deploy Google Apps Script (5 min)

```bash
# Step A: Open Google Apps Script
1. Go to: https://script.google.com
2. Create New Project
3. Copy SEMUA kode dari: FEISTY_BOT_AI_MANAGED.gs
4. Paste ke GAS editor

# Step B: Deploy as Web App
1. GAS Project > Deploy > New Deployment
2. Type: Web app
3. Execute as: Your Email
4. Access: Anyone
5. Copy URL hasil = GAS_WEBHOOK_URL
```

### 2️⃣ Setup Google Sheets (2 min)

```bash
# Create Spreadsheet
1. Google Drive > New > Google Sheets
2. Name: "Feisty Data"
3. Copy ID dari URL (antara /d/ dan /edit)
4. Paste ke GAS: const SPREADSHEET_ID = 'YOUR_ID'

# Setup Sheets
1. GAS > Run setupSheets() function
2. Sheets otomatis dibuat:
   - Menu, Orders, Customers, Pengaturan, CS_Pengetahuan, CONFIG, Logs
```

### 3️⃣ Configure API Keys (3 min)

```bash
# Gemini API
1. https://ai.google.dev/ > Create API Key
2. Google Sheets > CONFIG sheet > gemini_key row > paste key

# Midtrans (Optional)
1. https://dashboard.midtrans.com > Copy Server Key
2. CONFIG > midtrans_key > paste

# Stripe (Optional)  
1. https://dashboard.stripe.com > Copy Secret Key
2. CONFIG > stripe_key > paste

# Whacenter (WhatsApp)
1. https://whacenter.com > Get credentials
2. CONFIG > whatsapp_url & whatsapp_device_id > fill

# Admin Password
1. CONFIG > admin_password > set to secure value (e.g., "Abc123@Feisty")
```

### 4️⃣ Update Frontend (2 min)

```javascript
// Edit config.js
const FeistyConfig = {
  GAS_URL: 'https://script.google.com/macros/d/YOUR_GAS_SCRIPT_ID/useweb',
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  // ... rest of config
};
```

### 5️⃣ Test It! (5 min)

```bash
# Test Landing Page
1. Open index.html in browser
2. Verify "Pesan Sekarang" button works
3. Should load menu & config

# Test Ordering
1. Click "Pesan Sekarang" > Go to order.html
2. Add items to cart
3. Fill customer data
4. Submit order
5. Check Google Sheets > Orders sheet (should have new row)

# Test Admin
1. Open admin.html
2. Login with password dari CONFIG
3. Should see dashboard with stats
4. Try adding menu item
5. Check Logs sheet for activity

# Test Payment (Optional)
1. Create order with "Card" method
2. Should redirect ke Midtrans/Stripe
3. Test payment flow
```

---

## 🎯 Key Features Checklist

- ✅ Landing page dengan menu showcase
- ✅ Order page dengan keranjang & checkout
- ✅ Admin dashboard dengan semua fitur management
- ✅ Admin login dengan password & token
- ✅ API keys aman di server (CONFIG sheet)
- ✅ Input validation & sanitization
- ✅ Payment gateway integration (Midtrans/Stripe)
- ✅ Activity logging ke Logs sheet
- ✅ Email notifications
- ✅ Cart persistence di localStorage
- ✅ Mobile responsive design
- ✅ Lazy loading images

---

## 🔑 Default Credentials

| Item | Value | Where |
|------|-------|-------|
| Admin Password | `changeme123` | CONFIG sheet |
| Spreadsheet | Created during setup | SPREADSHEET_ID |
| GAS Webhook | From deployment | GAS_URL |

---

## 📞 Support URLs

| Service | URL |
|---------|-----|
| Google Apps Script | https://script.google.com |
| Google Sheets | https://sheets.google.com |
| Gemini API | https://ai.google.dev |
| Midtrans | https://dashboard.midtrans.com |
| Stripe | https://dashboard.stripe.com |
| Whacenter | https://whacenter.com |

---

## ⚠️ Important Notes

1. **Password Security**
   - Change default admin password IMMEDIATELY after setup
   - Use strong password: min 8 chars, mix of letters/numbers
   - Only you should know this

2. **API Keys Security**  
   - NEVER commit API keys to git
   - Use environment variables or secrets manager
   - Rotate keys periodically

3. **Testing**
   - Test with Midtrans/Stripe SANDBOX first
   - Only enable LIVE mode after thorough testing
   - Monitor Logs sheet for errors

4. **Performance**
   - Logs sheet has ~1000 row limit (auto-cleanup)
   - Monitor Orders sheet size
   - Archive old orders periodically

5. **Backup**
   - Regularly backup Google Sheets
   - Export GAS code to git
   - Keep deployment URL & script ID safe

---

## 🐛 Troubleshooting

### Problem: "Unauthorized" saat upgrade order
**Solution:** Verify admin password di CONFIG sheet sudah benar

### Problem: Payment redirect tidak jalan
**Solution:** Check Midtrans/Stripe keys di CONFIG sheet

### Problem: WA notification tidak terkirim  
**Solution:** Verify Whacenter credentials & ADMIN_PHONE di GAS

### Problem: Images tidak loading
**Solution:** Check image URL format, verify CORS settings

### Problem: Cart tidak tersimpan
**Solution:** Check localStorage di browser (DevTools > Application)

---

## 📚 Documentation

- **Full Setup Guide:** [SETUP.md](./SETUP.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **API Reference:** In-code comments in FEISTY_BOT_AI_MANAGED.gs

---

## 🎉 Ready to Go!

Your Feisty Bot system is now ready. Next steps:

1. ✅ Test dengan real data
2. ✅ Configure WhatsApp notifications
3. ✅ Setup payment gateways
4. ✅ Launch to production
5. ✅ Monitor & optimize

**Happy Selling! 🍽️**
