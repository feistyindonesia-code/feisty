// ==================================================
// FEISTY ORDER - AI MANAGED CHATBOT v2.1
// ENHANCED VERSION WITH MULTI-USER ADMIN, INVENTORY & ANALYTICS
// ==================================================

const SPREADSHEET_ID = '1awdtyC3VsPX50xj8LKLk2LbNM7CNuCEv1jL1UbwLbXo';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';
const SETTINGS_SHEET = 'Pengaturan';
const CUSTOMERS_SHEET = 'Customers';
const ORDERS_SHEET = 'Orders';
const CS_KNOWLEDGE_SHEET = 'CS_Pengetahuan';
const BOT_MESSAGES_SHEET = 'Bot_Pesan';
const ADMIN_USERS_SHEET = 'Admin_Users'; // NEW: Multi-user admin
const INVENTORY_SHEET = 'Inventory'; // NEW: Stock management
const LOYALTY_SHEET = 'Loyalty_Points'; // NEW: Customer loyalty
const POS_SHEET = 'POS_Transactions'; // NEW: POS transactions
const TABLES_SHEET = 'Tables'; // NEW: Table management

const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const ADMIN_PHONE = "6287787655880";

// Gemini API Configuration
// NOTE: API Key moved to CONFIG sheet - do NOT hardcode here
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// SIMPLIFIED STATE MANAGEMENT
const STATE_WAIT_NAME = "WAIT_NAME";
const STATE_CONVERSATION = "CONVERSATION";

// Bot timeout in milliseconds (15 minutes)
const BOT_TIMEOUT_MS = 15 * 60 * 1000;

const PROCESSED_ORDER_IDS = {};

// ==================================================
// SETUP SHEETS FUNCTION
// ==================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Setup Customers Sheet
  let sh = ss.getSheetByName(CUSTOMERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CUSTOMERS_SHEET);
  }
  const custHeaders = ['phone', 'nama', 'alamat', 'tipe_diskon', 'nilai_diskon', 'state', 'last_activity', 'created_at', 'updated_at'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, custHeaders.length).setValues([custHeaders]);
    sh.getRange(1, 1, 1, custHeaders.length).setFontWeight('bold').setBackground('#E0FFE0');
  }
  
  // 2. Setup Orders Sheet
  sh = ss.getSheetByName(ORDERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ORDERS_SHEET);
  }
  const orderHeaders = ['timestamp', 'phone', 'nama', 'alamat', 'items', 'subtotal', 'ongkir', 'diskon', 'total', 'payment_method', 'order_id', 'status'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
    sh.getRange(1, 1, 1, orderHeaders.length).setFontWeight('bold').setBackground('#E0E0FF');
  }
  
  // 3. Setup Menu Sheet
  sh = ss.getSheetByName(MENU_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MENU_SHEET);
  }
  const menuHeaders = ['nama', 'deskripsi', 'harga', 'harga_asli', 'diskon_persen', 'kategori', 'gambar', 'aktif', 'urutan'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, menuHeaders.length).setValues([menuHeaders]);
    sh.getRange(1, 1, 1, menuHeaders.length).setFontWeight('bold').setBackground('#FFE0D6');
  }
  
  // 4. Setup Lokasi Sheet
  sh = ss.getSheetByName(LOCATION_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOCATION_SHEET);
  }
  const locHeaders = ['nama_toko', 'latitude', 'longitude'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, locHeaders.length).setValues([locHeaders]);
    sh.getRange(1, 1, 1, locHeaders.length).setFontWeight('bold').setBackground('#FFF0E0');
    sh.appendRow(['Feisty Kitchen', -6.2088, 106.8456]);
  }
  
  // 5. Setup Pengaturan Sheet
  sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
  }
  const setHeaders = ['setting', 'value', 'description'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, setHeaders.length).setValues([setHeaders]);
    sh.getRange(1, 1, 1, setHeaders.length).setFontWeight('bold').setBackground('#FFF0F0');
    sh.appendRow(['base_shipping_cost', 10000, 'Base shipping cost in IDR']);
    sh.appendRow(['shipping_cost_per_km', 2000, 'Additional cost per km']);
    sh.appendRow(['free_shipping_min_distance', 5, 'Min distance for free shipping (km)']);
    sh.appendRow(['qris_fee', 1000, 'QRIS transaction fee']);
  }
  
  // 6. Setup CS Knowledge Base Sheet
  sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CS_KNOWLEDGE_SHEET);
  }
  const csHeaders = ['kategori', 'keywords', 'jawaban', 'contoh_pertanyaan'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, csHeaders.length).setValues([csHeaders]);
    sh.getRange(1, 1, 1, csHeaders.length).setFontWeight('bold').setBackground('#F0E0FF');
    sh.appendRow(['Menu', 'menu,makanan,minuman,pilihan,ada apa', 'Feisty menyediakan berbagai pilihan makanan dan minuman berkualitas.', 'ada menu apa?']);
    sh.appendRow(['Harga', 'harga,mahal,murah,bayar,biaya', 'Harga bervariasi dari Rp 15.000 - Rp 100.000 tergantung menu yang dipilih.', 'berapa harganya?']);
    sh.appendRow(['Pengiriman', 'kirim,antar,ongkir,delivery', 'Kami menyediakan layanan pengiriman dengan biaya ongkir berdasarkan jarak. Minimal pesan Rp 50.000.', 'bisa antar?']);
    sh.appendRow(['Pembayaran', 'bayar,cod,qris,tunai', 'Kami menerima pembayaran via QRIS dan COD (Bayar di Tempat).', 'bayar lewat apa?']);
    sh.appendRow(['Jam Buka', 'buka,tutup,jam,kerja', 'Feisty beroperasi setiap hari. Hubungi admin untuk jam operasional terbaru.', 'jam berapa tutup?']);
  }

  // 7. Setup CONFIG Sheet (for API keys and custom settings)
  sh = ss.getSheetByName('CONFIG');
  if (!sh) {
    sh = ss.insertSheet('CONFIG');
  }
  const cfgHeaders = ['Key', 'Value', 'UpdatedAt'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, cfgHeaders.length).setValues([cfgHeaders]);
    sh.getRange(1, 1, 1, cfgHeaders.length).setFontWeight('bold').setBackground('#E0F0FF');
    sh.appendRow(['admin_password', 'changeme123', new Date()]);
    sh.appendRow(['gemini_key', 'AIzaSy...', new Date()]);
    sh.appendRow(['whatsapp_url', 'https://api.whacenter.com', new Date()]);
    sh.appendRow(['whatsapp_device_id', '92b2af76-130d-46f0-b811-0874e3407988', new Date()]);
    sh.appendRow(['midtrans_key', '', new Date()]);
    sh.appendRow(['stripe_key', '', new Date()]);
    sh.appendRow(['base_url', 'https://yourfeisty.com', new Date()]);
    sh.appendRow(['maintenance_mode', 'false', new Date()]);
  }
  
  // 8. NEW: Setup Admin_Users Sheet (Multi-user support)
  sh = ss.getSheetByName(ADMIN_USERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ADMIN_USERS_SHEET);
  }
  const adminHeaders = ['username', 'password_hash', 'role', 'nama_lengkap', 'email', 'aktif', 'created_at', 'last_login'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, adminHeaders.length).setValues([adminHeaders]);
    sh.getRange(1, 1, 1, adminHeaders.length).setFontWeight('bold').setBackground('#FFD700');
    // Default admin user
    sh.appendRow(['admin', Utilities.base64Encode('changeme123'), 'owner', 'Administrator', 'admin@feisty.id', true, new Date(), '']);
  }
  
  // 9. NEW: Setup Inventory Sheet
  sh = ss.getSheetByName(INVENTORY_SHEET);
  if (!sh) {
    sh = ss.insertSheet(INVENTORY_SHEET);
  }
  const invHeaders = ['menu_id', 'nama_menu', 'stok', 'satuan', 'stok_min', 'stok_max', 'updated_at'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, invHeaders.length).setValues([invHeaders]);
    sh.getRange(1, 1, 1, invHeaders.length).setFontWeight('bold').setBackground('#90EE90');
  }
  
  // 10. NEW: Setup Loyalty Points Sheet
  sh = ss.getSheetByName(LOYALTY_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOYALTY_SHEET);
  }
  const loyaltyHeaders = ['phone', 'nama', 'total_poin', 'total_pemesanan', 'total_belanja', 'poin_dipakai', 'tier', 'created_at', 'updated_at'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, loyaltyHeaders.length).setValues([loyaltyHeaders]);
    sh.getRange(1, 1, 1, loyaltyHeaders.length).setFontWeight('bold').setBackground('#FFB6C1');
  }
  
  // 11. NEW: Setup Tables Sheet (for dine-in)
  sh = ss.getSheetByName(TABLES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TABLES_SHEET);
  }
  const tableHeaders = ['nomor_meja', 'kapasitas', 'status', 'customer_name', 'created_at'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, tableHeaders.length).setValues([tableHeaders]);
    sh.getRange(1, 1, 1, tableHeaders.length).setFontWeight('bold').setBackground('#87CEEB');
    // Sample tables
    sh.appendRow([1, 4, 'available', '', '']);
    sh.appendRow([2, 4, 'available', '', '']);
    sh.appendRow([3, 6, 'available', '', '']);
    sh.appendRow([4, 2, 'available', '', '']);
    sh.appendRow([5, 8, 'available', '', '']);
  }
  
  // 12. NEW: Setup POS Transactions Sheet
  sh = ss.getSheetByName(POS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(POS_SHEET);
  }
  const posHeaders = ['transaction_id', 'timestamp', 'type', 'table_number', 'items', 'subtotal', 'tax', 'discount', 'total', 'payment_method', 'cash', 'change', 'cashier', 'status', 'notes'];
  if (sh.getLastRow() <= 1) {
    sh.getRange(1, 1, 1, posHeaders.length).setValues([posHeaders]);
    sh.getRange(1, 1, 1, posHeaders.length).setFontWeight('bold').setBackground('#98FB98');
  }
  
  return { status: 'success', message: 'All sheets setup completed' };
}

// ==================================================
// DOGET - untuk index.html
// ==================================================
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback;
  const phone = e?.parameter?.phone;
  
  let result;
  
  if (action === 'getMenu') result = getMenu();
  else if (action === 'getLocation') result = getLocation();
  else if (action === 'getConfig') result = getConfig();
  else if (action === 'getCustomConfig') result = getCustomConfig();
  else if (action === 'adminGetAll') {
    const token = e?.parameter?.admin_token || '';
    if (!verifyAdminToken(token)) {
      result = { error: 'Unauthorized' };
    } else {
      result = {
        menu: getMenu(),
        orders: getOrders(),
        customers: getAllCustomers(),
        knowledge: getAllCSKnowledge(),
        settings: getSettings()
      };
    }
  }
  else if (action === 'getCustomer') result = getCustomerByPhone(phone);
  else if (action === 'getOrders') result = getOrders();
  else if (action === 'getCustomers') result = getAllCustomers();
  else if (action === 'getCSKnowledge') result = getAllCSKnowledge();
  else if (action === 'getTables') result = getTables();
  else if (action === 'getPOSTransactions') {
    const dateFilter = e?.parameter?.date || null;
    result = getPOSTransactions(dateFilter);
  }
  else if (action === 'getPOSDailyReport') {
    const date = e?.parameter?.date || null;
    result = getPOSDailyReport(date);
  }
  else if (action === 'getPOSSummary') result = getPOSSummary();
  else if (action === 'runSetup') result = setupSheets();
  else result = { error: 'Invalid action: ' + action };
  
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================================================
// DOPOST - untuk webhook Whacenter
// ==================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData?.contents || "{}");
    // Admin login (returns token)
    if (body.action === 'adminLogin') {
      const res = adminLogin(body.password || "");
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    // ADMIN-protected actions
    const adminActions = ['saveCustomConfig', 'addMenuItem', 'deleteMenu', 'addKnowledge', 'saveSettings', 'updateOrderStatus', 'deleteKnowledge', 'updateMenuItem', 'addAdminUser', 'updateAdminUser', 'deleteAdminUser', 'addInventoryItem', 'updateInventoryItem', 'deleteInventoryItem', 'addLoyaltyPoints', 'useLoyaltyPoints', 'createPOSOrder', 'updateTableStatus', 'addTable', 'deleteTable'];
    if (adminActions.indexOf(body.action) !== -1) {
      const token = body.admin_token || '';
      if (!verifyAdminToken(token)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
      }

      // Multi-user login
      if (body.action === 'adminLoginMulti') {
        const r = adminLoginMulti(body.username || '', body.password || '');
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Admin user management
      if (body.action === 'addAdminUser') {
        const r = addAdminUser(body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'updateAdminUser') {
        const r = updateAdminUser(body.index, body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'deleteAdminUser') {
        const r = deleteAdminUser(body.index);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Inventory management
      if (body.action === 'addInventoryItem') {
        const r = addInventoryItem(body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'updateInventoryItem') {
        const r = updateInventoryItem(body.index, body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'deleteInventoryItem') {
        const r = deleteInventoryItem(body.index);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Loyalty management
      if (body.action === 'addLoyaltyPoints') {
        const r = addLoyaltyPoints(body.phone, body.nama, Number(body.totalOrder) || 0);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'useLoyaltyPoints') {
        const r = useLoyaltyPoints(body.phone, Number(body.points) || 0);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      
      // POS management
      if (body.action === 'createPOSOrder') {
        const r = createPOSOrder(body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'updateTableStatus') {
        const r = updateTableStatus(body.table_number, body.status, body.customer_name);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'addTable') {
        const r = addTable(Number(body.capacity) || 4);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'deleteTable') {
        const r = deleteTable(body.table_number);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }

      // Route admin actions
      if (body.action === 'saveCustomConfig') {
        const obj = Object.assign({}, body);
        delete obj.action; delete obj.admin_token;
        const r = saveCustomConfigObj(obj);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'addMenuItem') {
        const r = addMenuItem(body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'updateMenuItem') {
        const r = updateMenuItem(body.index, body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'deleteMenu') {
        const r = deleteMenuItem(body.menu_id || body.index);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'addKnowledge') {
        const r = addCSKnowledge(body);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'deleteKnowledge') {
        const r = deleteCSKnowledge(body.index);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'saveSettings') {
        const obj = Object.assign({}, body);
        delete obj.action; delete obj.admin_token;
        const r = saveSettingsObj(obj);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
      if (body.action === 'updateOrderStatus') {
        const r = updateOrderStatus(body.order_id, body.status);
        return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Handle ORDER dari index.html (public)
    if (body.action === 'ORDER') {
      handleOrderFromIndex(body);
      return ok();
    }

    // PUBLIC payment endpoints (client-side initiated, but processed server-side)
    if (body.action === 'createPaymentMidtrans') {
      const result = createMidtransPayment(body.order_id, body.amount, body.customer_email, body.customer_phone);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    if (body.action === 'createPaymentStripe') {
      const result = createStripePayment(body.order_id, body.amount, body.customer_email);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle normal WA messages
    const phone = body.number || body.from || body.sender || "";
    const text = (body.message || body.body || body.text || "").trim();
    
    if (!phone || !text) {
      return ok();
    }
    
    const normalizedPhone = normalizeNumber(phone);
    handleIncomingWA(normalizedPhone, text);
    return ok();

  } catch (err) {
    return ok();
  }
}

function ok() {
  return ContentService.createTextOutput("OK");
}

// ==================================================
// LOG TO SHEET
// ==================================================
function logToSheet(message, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName("Logs");
    if (!sh) {
      sh = ss.insertSheet("Logs");
      sh.appendRow(["Timestamp", "Message", "Data"]);
    }
    
    let dataStr = "";
    if (typeof data === 'object' && data !== null) {
      dataStr = JSON.stringify(data);
    } else {
      dataStr = String(data || "");
    }
    
    sh.appendRow([new Date(), message, dataStr.substring(0, 1000)]);
  } catch (err) {
    // Ignore logging errors
  }
}

// ==================================================
// MAIN BOT LOGIC - AI MANAGED
// ==================================================
function handleIncomingWA(phone, text) {
  try {
    logToSheet("=== INCOMING WA ===", "");
    logToSheet("Phone:", phone);
    logToSheet("Text:", text);
    
    // Update last activity
    updateLastActivity(phone);
    
    // Check if customer exists
    let customer = getCustomer(phone);
    
    if (!customer) {
      // New customer: ask for name
      logToSheet("New customer, saving...", "");
      saveNewCustomer(phone);
      sendWA(phone, "👋 Selamat datang di Feisty!\n\nBoleh kami tahu nama Kakak untuk melanjutkan? 😊");
      return;
    }
    
    logToSheet("Customer state:", customer.state);
    logToSheet("Customer name:", customer.name);
    
    // Check timeout (15 minutes inactivity)
    if (customer.last_activity) {
      const lastActivity = new Date(customer.last_activity).getTime();
      const now = Date.now();
      if (now - lastActivity > BOT_TIMEOUT_MS) {
        logToSheet("Bot timeout (15 min), reset to CONVERSATION...", "");
        updateCustomerState(phone, STATE_CONVERSATION);
        sendWA(phone, `⏰ Sesi lama tidak aktif. Hai Kak ${customer.name}, lanjutkan percakapan! 😊`);
        return;
      }
    }
    
    // MAIN LOGIC: Route to appropriate handler based on state
    if (customer.state === STATE_WAIT_NAME) {
      handleWaitName(phone, text, customer);
    } else if (customer.state === STATE_CONVERSATION) {
      handleConversation(phone, text, customer);
    } else {
      // Unknown state, default to CONVERSATION
      updateCustomerState(phone, STATE_CONVERSATION);
      handleConversation(phone, text, customer);
    }
    
  } catch (err) {
    logToSheet("ERROR handleIncomingWA:", err.toString());
  }
}

// ==================================================
// HANDLE WAIT NAME STATE
// ==================================================
function handleWaitName(phone, text, customer) {
  const input = text.trim();
  
  if (input.length < 2) {
    sendWA(phone, "Nama minimal 2 karakter. Boleh kami tahu nama Kakak? 😊");
    return;
  }
  
  // Validate if input is REALLY a name using AI
  const validation = validateNameWithAI(input);
  
  if (!validation.isName) {
    logToSheet("Input rejected (not a name):", input);
    sendWA(phone, `Maaf Kak, "${input}" sepertinya bukan nama. 😊\n\nBoleh kami tahu nama Kakak sebenarnya? Nama lengkap atau nama panggilan juga bisa!`);
    return;
  }
  
  const name = validation.cleanedName || input;
  
  // Update customer with name and set to CONVERSATION
  updateCustomer(phone, name, STATE_CONVERSATION);
  logToSheet("Customer registered:", name);
  logToSheet("Name validation score:", validation.confidence);
  
  // Send welcome and initial greeting
  sendWA(phone, `✨ Halo Kak ${name}! ✨\n\nSenang berkenalan dengan Kakak! 🙏\n\nFeisty siap melayani Kakak dengan berbagai pilihan makanan dan minuman lezat. Ada yang bisa saya bantu?`);
}

// ==================================================
// HANDLE CONVERSATION STATE (AI POWERED)
// ==================================================
function handleConversation(phone, text, customer) {
  try {
    const textLower = text.toLowerCase();
    
    // Special commands
    if (textLower === 'menu') {
      sendMenuViaWA(phone, customer);
      return;
    }
    
    if (textLower === 'pesan' || textLower === 'order') {
      sendWA(phone, `🛒 *PEMESANAN*\n\nBaik Kak ${customer.name}, silakan klik link di bawah untuk memilih menu:\n\n➡️ feisty.my.id/?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}\n\nData Kakak sudah terisi otomatis! 🎉`);
      return;
    }
    
    // DETECT if customer asking for menu/photos
    if (isMenuRequest(textLower)) {
      sendMenuViaWA(phone, customer);
      return;
    }
    
    // DETECT CONVERSATION CONTEXT
    const contextAnalysis = detectConversationContext(text, customer);
    logToSheet("Conversation context:", contextAnalysis.category);
    logToSheet("Context confidence:", contextAnalysis.confidence);
    
    // Jika off-topic, SILENT - jangan kirim pesan apapun
    if (!contextAnalysis.isFeistyRelated) {
      logToSheet("OFF-TOPIC MESSAGE IGNORED:", text);
      logToSheet("Reason:", contextAnalysis.reason);
      return; // Silent, no response
    }
    
    // Get AI response based on user message
    const response = getAIResponse(text, customer);
    sendWA(phone, response);
    
  } catch (err) {
    logToSheet("ERROR handleConversation:", err.toString());
    sendWA(phone, "Maaf, ada kesalahan. Silakan coba lagi! 🙏");
  }
}

// ==================================================
// MENU REQUEST HANDLER
// ==================================================
function isMenuRequest(textLower) {
  const menuKeywords = [
    'lihat menu', 'tampilkan menu', 'menu apa', 'ada menu apa', 'menu apa saja',
    'lihat foto', 'foto produk', 'gambar produk', 'tampilkan foto', 'foto makanan',
    'produk apa', 'apa saja yang ada', 'pilihan menu', 'katalog',
    'lihat daftar', 'daftar menu', 'daftar harga', 'price list'
  ];
  
  return menuKeywords.some(keyword => textLower.includes(keyword));
}

function sendMenuViaWA(phone, customer) {
  try {
    logToSheet("Sending menu to:", phone);
    
    // Get formatted menu from sheet
    const menuData = getMenuFormatted();
    
    if (!menuData || menuData.length === 0) {
      sendWA(phone, `Maaf Kak ${customer.name}, menu sedang tidak tersedia. 😔\n\nSilakan hubungi admin atau coba lagi nanti. 🙏`);
      return;
    }
    
    // Group menu by kategori
    const menuByCategory = {};
    menuData.forEach(item => {
      const cat = item.kategori || 'Lainnya';
      if (!menuByCategory[cat]) menuByCategory[cat] = [];
      menuByCategory[cat].push(item);
    });
    
    // Send menu header
    let headerMsg = `🍽️ *MENU FEISTY*\n\nHalo Kak ${customer.name}! 👋\n\n`;
    headerMsg += `Total ${menuData.length} item menu tersedia.\n\n`;
    headerMsg += `Berikut daftar menu kami:\n`;
    headerMsg += `━━━━━━━━━━━━━━━━━━━━━`;
    
    sendWA(phone, headerMsg);
    Utilities.sleep(500);
    
    // Send menu by category with images
    Object.keys(menuByCategory).forEach(kategori => {
      const items = menuByCategory[kategori];
      let categoryMsg = `\n📂 *${kategori.toUpperCase()}*\n\n`;
      
      items.forEach(item => {
        const priceStr = item.harga_diskon > 0 ? 
          `Rp ${item.harga_diskon.toLocaleString('id-ID')}` :
          `Rp ${item.harga.toLocaleString('id-ID')}`;
        
        let itemStr = `🔸 *${item.nama}*\n`;
        if (item.deskripsi) {
          itemStr += `${item.deskripsi}\n`;
        }
        itemStr += `💰 ${priceStr}`;
        
        // Add discount info if available
        if (item.harga_asli > item.harga || item.diskon_persen > 0) {
          const discount = item.diskon_persen > 0 ? item.diskon_persen : 
            Math.round(((item.harga_asli - item.harga) / item.harga_asli) * 100);
          itemStr += ` (Diskon ${discount}%)`;
        }
        
        itemStr += `\n`;
        
        // Try to send image if available
        if (item.gambar && item.gambar.trim() !== '') {
          itemStr += `🖼️ Foto: ${item.gambar}\n`;
        }
        
        categoryMsg += itemStr + `\n`;
      });
      
      sendWA(phone, categoryMsg);
      Utilities.sleep(500);
    });
    
    // Send footer with order link
    const orderLink = `feisty.my.id/?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}`;
    const footerMsg = `━━━━━━━━━━━━━━━━━━━━━\n\n📝 *Untuk Memesan*\n\nSilakan klik link di bawah untuk order:\n\n➡️ ${orderLink}\n\nAtau ketik *pesan* untuk langsung ke halaman order.\n\nTerima kasih telah memilih Feisty! 🙏`;
    
    sendWA(phone, footerMsg);
    
    logToSheet("Menu sent successfully to:", phone);
    
  } catch (err) {
    logToSheet("ERROR sendMenuViaWA:", err.toString());
    sendWA(phone, `Maaf, ada kesalahan saat menampilkan menu. 😔 Silakan coba lagi nanti.`);
  }
}

function getMenuFormatted() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) return [];
    
    const rows = sh.getDataRange().getValues();
    if (rows.length === 0) return [];
    
    const header = rows.shift().map(h => h.toString().toLowerCase().trim());
    const idx = col => header.indexOf(col);
    
    const items = rows
      .filter(r => {
        const aktif = r[idx('aktif')];
        const aktifStr = String(aktif).toLowerCase();
        return aktif === true || aktif === 'true' || aktif === 'TRUE' || aktif === 1 || aktifStr === 'true';
      })
      .map((r, i) => {
        const harga = Number(r[idx('harga')]) || 0;
        const hargaAsli = Number(r[idx('harga_asli')]) || 0;
        const diskonPersen = Number(r[idx('diskon_persen')]) || 0;
        
        let hargaDiskon = harga;
        if (hargaAsli > 0 && hargaAsli > harga) {
          hargaDiskon = harga;
        } else if (diskonPersen > 0) {
          hargaDiskon = Math.round(harga * (100 - diskonPersen) / 100);
        }
        
        return {
          id: i + 1,
          nama: r[idx('nama')] || '',
          deskripsi: r[idx('deskripsi')] || '',
          harga: harga,
          harga_asli: hargaAsli,
          diskon_persen: diskonPersen,
          harga_diskon: hargaDiskon,
          kategori: r[idx('kategori')] || 'Lainnya',
          gambar: r[idx('gambar')] || '',
          aktif: true,
          urutan: Number(r[idx('urutan')]) || 0
        };
      })
      .sort((a, b) => a.urutan - b.urutan);
    
    return items;
  } catch (err) {
    logToSheet("ERROR getMenuFormatted:", err.toString());
    return [];
  }
}

// ==================================================
// CONVERSATION CONTEXT DETECTOR (Feisty-related check)
// ==================================================
function detectConversationContext(userMessage, customer) {
  try {
    const prompt = `Analyze if this message is related to Feisty food and beverage ordering service.

FEISTY CONTEXT (should accept):
- Questions about menu, food, drinks, prices
- Order inquiries, delivery questions
- Payment methods (QRIS, COD)
- Compliments/feedback about Feisty
- Anything food/beverage/restaurant related

NON-FEISTY CONTEXT (should reject):
- Messages from other company's CS trying to recruit/sell
- Personal chats with admin's friends
- Technical issues unrelated to Feisty
- Spam or phishing attempts
- Asking to contact other businesses
- "Saya dari [perusahaan lain] CS, bisa bantu?"
- Random personal life topics

MESSAGE: "${userMessage}"

RESPOND with ONLY a JSON (no markdown):
{
  "isFeistyRelated": true/false,
  "category": "customer_inquiry|order|delivery|payment|feedback|off_topic|suspicious|other",
  "confidence": 0.0-1.0,
  "reason": "brief reason in Indonesian"
}

Examples:
- "Mau pesan 2 nasi goreng" → {"isFeistyRelated": true, "category": "order", "confidence": 1.0, "reason": "Jelas order makanan"}
- "Berapa biaya ongkir?" → {"isFeistyRelated": true, "category": "delivery", "confidence": 1.0, "reason": "Pertanyaan delivery"}
- "Saya CS dari GoFood, ada yang bisa dibantu?" → {"isFeistyRelated": false, "category": "suspicious", "confidence": 0.95, "reason": "Klaim CS dari perusahaan lain"}
- "Kemarin makan disini enak banget!" → {"isFeistyRelated": true, "category": "feedback", "confidence": 1.0, "reason": "Feedback positif"}
- "Hari ini cuaca cerah ya" → {"isFeistyRelated": false, "category": "off_topic", "confidence": 0.99, "reason": "Obrolan personal bukan tentang Feisty"}
- "Bisa bayar pake gopay?" → {"isFeistyRelated": true, "category": "payment", "confidence": 1.0, "reason": "Pertanyaan pembayaran"}
- "Teman saya nyari jasa grafis" → {"isFeistyRelated": false, "category": "off_topic", "confidence": 0.98, "reason": "Topik bisnis lain"}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const geminiKey = getAPIKey('gemini_key', '');
    if (!geminiKey) {
      Logger.log('Warning: Gemini API key not configured in CONFIG sheet');
      return {isFeistyRelated: false, category: 'error', confidence: 0, reason: 'API key missing'};
    }
    const url = GEMINI_API_URL + "?key=" + geminiKey;
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 15
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates.length > 0) {
      const aiResponse = result.candidates[0].content.parts[0].text.trim();
      
      try {
        let jsonStr = aiResponse;
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                         aiResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                         aiResponse.match(/({[\s\S]*})/);
        
        if (jsonMatch) {
          jsonStr = jsonMatch[1] || jsonMatch[0];
        }
        
        const analysis = JSON.parse(jsonStr);
        
        return {
          isFeistyRelated: analysis.isFeistyRelated === true,
          category: analysis.category || "other",
          confidence: analysis.confidence || 0.5,
          reason: analysis.reason || "Analysis completed"
        };
      } catch (e) {
        logToSheet("Context detection JSON error:", e.toString());
        return fallbackContextDetection(userMessage);
      }
    }
    
    return fallbackContextDetection(userMessage);
    
  } catch (err) {
    logToSheet("Context detection error:", err.toString());
    return fallbackContextDetection(userMessage);
  }
}

// Fallback context detection dengan rules
function fallbackContextDetection(message) {
  const msg = message.toLowerCase();
  
  // WHITELIST - Topics related to Feisty
  const feistyKeywords = [
    'menu', 'makanan', 'minuman', 'pesan', 'order', 'beli', 'harga',
    'ongkir', 'pengiriman', 'kirim', 'antar', 'delivery', 'bayar',
    'pembayaran', 'qris', 'cod', 'tunai', 'gopay', 'transfer',
    'alamat', 'lokasi', 'jam buka', 'buka tutup', 'promo', 'diskon',
    'makanan lezat', 'enak', 'sedap', 'nikmat', 'feisty',
    'restoran', 'cafe', 'kedai', 'warung', 'toko', 'makanan',
    'nasi', 'mie', 'ayam', 'minuman', 'kopi', 'jus', 'teh'
  ];
  
  // BLACKLIST - Suspicious patterns
  const suspiciousKeywords = [
    'saya dari',
    'saya cs',
    'saya admin',
    'dari perusahaan',
    'dari go',
    'dari grab',
    'rekrutmen',
    'lowongan',
    'kerja',
    'gaji',
    'phishing',
    'pinjam uang',
    'transfer uang',
    'judi',
    'togel'
  ];
  
  // Check if suspicious
  if (suspiciousKeywords.some(keyword => msg.includes(keyword))) {
    return {
      isFeistyRelated: false,
      category: "suspicious",
      confidence: 0.85,
      reason: "Detected suspicious pattern"
    };
  }
  
  // Check if Feisty-related
  const hasFeistyKeyword = feistyKeywords.some(keyword => msg.includes(keyword));
  
  if (hasFeistyKeyword) {
    let category = "other";
    if (msg.includes('menu') || msg.includes('makanan') || msg.includes('minuman')) category = "customer_inquiry";
    if (msg.includes('pesan') || msg.includes('order') || msg.includes('beli')) category = "order";
    if (msg.includes('ongkir') || msg.includes('pengiriman') || msg.includes('antar')) category = "delivery";
    if (msg.includes('bayar') || msg.includes('pembayaran') || msg.includes('qris') || msg.includes('cod')) category = "payment";
    if (msg.includes('enak') || msg.includes('lezat') || msg.includes('nikmat') || msg.includes('sedap')) category = "feedback";
    
    return {
      isFeistyRelated: true,
      category: category,
      confidence: 0.8,
      reason: "Matched Feisty keywords"
    };
  }
  
  // Default: off-topic
  return {
    isFeistyRelated: false,
    category: "off_topic",
    confidence: 0.7,
    reason: "No Feisty-related keywords detected"
  };
}

// ==================================================
// AI NAME VALIDATION (untuk WAIT_NAME state)
// ==================================================
function validateNameWithAI(input) {
  try {
    const prompt = `Analyze the following input and determine if it's a REAL NAME or NOT.

CONTEXT:
- This is from an Indonesian customer
- Could be full name, nickname, first name only, or any real name
- Indonesian names, Arabic names, English names all accepted
- But NOT if it's: greeting, question, sentence, random words, emojis only, etc.

INPUT: "${input}"

RESPOND with ONLY a JSON (no markdown, no extra text):
{
  "isName": true/false,
  "cleanedName": "the name if valid, null if not",
  "confidence": 0.0-1.0,
  "reason": "brief reason in Indonesian"
}

Examples:
- "Budi" → {"isName": true, "cleanedName": "Budi", "confidence": 1.0, "reason": "Nama Indonesia valid"}
- "Siti Nur Azizah" → {"isName": true, "cleanedName": "Siti Nur Azizah", "confidence": 1.0, "reason": "Nama lengkap Indonesia"}
- "Halo" → {"isName": false, "cleanedName": null, "confidence": 0.95, "reason": "Ini greeting bukan nama"}
- "Apa kabar?" → {"isName": false, "cleanedName": null, "confidence": 0.99, "reason": "Ini pertanyaan bukan nama"}
- "123" → {"isName": false, "cleanedName": null, "confidence": 0.98, "reason": "Hanya angka, bukan nama"}
- "R4h4y0" → {"isName": false, "cleanedName": null, "confidence": 0.85, "reason": "Kombinasi huruf-angka aneh"}
- "Muhammad Ali" → {"isName": true, "cleanedName": "Muhammad Ali", "confidence": 1.0, "reason": "Nama valid"}
- "😊😊😊" → {"isName": false, "cleanedName": null, "confidence": 1.0, "reason": "Hanya emoji"}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const geminiKey = getAPIKey('gemini_key', '');
    if (!geminiKey) {
      Logger.log('Warning: Gemini API key not found in CONFIG');
      return { isName: false, cleanedName: null, confidence: 0, reason: 'API key missing' };
    }
    const url = GEMINI_API_URL + "?key=" + geminiKey;
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 15
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates.length > 0) {
      const aiResponse = result.candidates[0].content.parts[0].text.trim();
      
      try {
        // Try to extract JSON from response
        let jsonStr = aiResponse;
        
        // If response contains markdown code blocks, extract the JSON
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                         aiResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                         aiResponse.match(/({[\s\S]*})/);
        
        if (jsonMatch) {
          jsonStr = jsonMatch[1] || jsonMatch[0];
        }
        
        const validation = JSON.parse(jsonStr);
        
        return {
          isName: validation.isName === true,
          cleanedName: validation.cleanedName || input,
          confidence: validation.confidence || 0.5,
          reason: validation.reason || "Validation completed"
        };
      } catch (e) {
        // If JSON parsing fails, fallback to simple rules
        logToSheet("Name validation JSON parse error:", e.toString());
        return fallbackNameValidation(input);
      }
    }
    
    return fallbackNameValidation(input);
    
  } catch (err) {
    logToSheet("Name validation error:", err.toString());
    return fallbackNameValidation(input);
  }
}

// Fallback validation jika AI gagal
function fallbackNameValidation(input) {
  const trimmed = input.trim();
  
  // Reject jika hanya angka
  if (/^\d+$/.test(trimmed)) {
    return { isName: false, cleanedName: null, confidence: 0.95, reason: "Hanya angka" };
  }
  
  // Reject jika hanya emoji
  if (/^[\p{Emoji}]+$/u.test(trimmed)) {
    return { isName: false, cleanedName: null, confidence: 1.0, reason: "Hanya emoji" };
  }
  
  // Reject jika mengandung kata-kata greeting/questions
  const invalidKeywords = ['apa', 'siapa', 'kapan', 'dimana', 'bagaimana', 'berapa', 'halo', 'hai', 'assalamualaikum', 'halo apa kabar', 'iyaa', 'iya', 'enggak', 'tidak', 'ya', 'nggak', 'ok', 'oke', 'sip'];
  const lowerInput = trimmed.toLowerCase();
  
  if (invalidKeywords.some(keyword => lowerInput === keyword || lowerInput.includes(keyword + '?') || lowerInput.includes(keyword + '!'))) {
    return { isName: false, cleanedName: null, confidence: 0.9, reason: "Terdeteksi greeting/pertanyaan" };
  }
  
  // Reject jika terlalu panjang (nama biasanya < 50 char)
  if (trimmed.length > 100) {
    return { isName: false, cleanedName: null, confidence: 0.85, reason: "Terlalu panjang untuk nama" };
  }
  
  // Reject kombinasi huruf-angka aneh
  if (/\d/.test(trimmed) && !/^[a-zA-Z\s\d'-]+$/.test(trimmed)) {
    return { isName: false, cleanedName: null, confidence: 0.8, reason: "Karakter tidak valid dalam nama" };
  }
  
  // Jika lolos validasi di atas, terima sebagai nama
  return { isName: true, cleanedName: trimmed, confidence: 0.75, reason: "Passed fallback validation" };
}

// ==================================================
// AI RESPONSE ENGINE (Gemini Powered)
// ==================================================
function getAIResponse(userMessage, customer) {
  try {
    // Get knowledge base
    const knowledgeBase = getKnowledgeBaseFormatted();
    
    // Build context for Gemini with intent detection
    const systemPrompt = `Anda adalah Customer Service Bot Feisty, layanan pemesanan makanan dan minuman online yang ramah dan helpful.

IDENTITAS:
- Nama Bot: Feisty CS Bot
- Nama Customer: ${customer.name || 'Kak'}
- Bahasa: Indonesian (casual & ramah)

TENTANG FEISTY:
- Menyediakan berbagai pilihan makanan dan minuman berkualitas
- Harga terjangkau (Rp 15.000 - Rp 100.000)
- Pengiriman tersedia dengan biaya ongkir berdasarkan jarak
- Terima pembayaran via QRIS dan COD (Bayar di Tempat)
- Minus pesan Rp 50.000 untuk delivery
- Link order: feisty.my.id

PENGETAHUAN BASIS:
${knowledgeBase}

INSTRUKSI RESPONS:
1. Pahami intent customer (mau tanya menu, pesan makanan, CS, dll)
2. Berikan respons yang helpful dan sopan dengan emoji
3. Jika customer mau pesan, tawarkan link order: feisty.my.id/?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}
4. Jika pertanyaan diluar scope, arahkan ke menu atau admin
5. SANGAT PENTING: Respons MAKSIMAL 300 karakter
6. Gunakan bahasa casual, jangan terlalu formal
7. Selalu ramah dan helpful

INTENT DETECTION:
- Menu/Product inquiry: Suggest link or describe menu
- Order: Provide order link
- Delivery/Shipping: Explain delivery info
- Payment: Explain payment methods
- General CS question: Answer from knowledge base
- Other: Keep friendly and redirect if needed

Pertanyaan Customer: "${userMessage}"

RESPONS (maksimal 300 karakter, dengan emoji):`;

    const payload = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }]
    };

    const geminiKey = getAPIKey('gemini_key', '');
    if (!geminiKey) {
      Logger.log('Warning: Gemini API key not configured');
      return { reply: 'Maaf, sistem AI sedang mengalami gangguan. Silakan hubungi admin.', hasKeyword: false };
    }
    const url = GEMINI_API_URL + "?key=" + geminiKey;
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 20
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates.length > 0) {
      const aiResponse = result.candidates[0].content.parts[0].text.trim();
      // Ensure response is not too long
      return aiResponse.substring(0, 500);
    }
    
    return getFallbackResponse(customer.name);
    
  } catch (err) {
    logToSheet("Gemini Error:", err.toString());
    return getFallbackResponse(customer.name);
  }
}

function getKnowledgeBaseFormatted() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return "";
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return "";
    
    let knowledge = "";
    for (let i = 1; i < data.length; i++) {
      const kategori = data[i][0] || "";
      const jawaban = data[i][2] || "";
      if (jawaban) {
        knowledge += `• [${kategori}]: ${jawaban.substring(0, 150)}\n`;
      }
    }
    
    return knowledge;
  } catch (err) {
    return "";
  }
}

function getFallbackResponse(name) {
  const responses = [
    `Halo Kak ${name}! 😊 Kebetulan saya kurang paham pertanyaan Kakak. Mau lihat menu atau ada pertanyaan lain? 🍽️`,
    `Kak ${name}, bisa jelaskan lagi? 🤔 Saya siap membantu! 💬`,
    `Maaf Kak, bisa diulang? 🙏 Saya ingin membantu dengan baik! 😊`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// ==================================================
// CUSTOMER DATABASE FUNCTIONS
// ==================================================
function getCustomer(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return null;
    
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = normalizeNumber(String(data[i][0]));
      if (rowPhone === normalizeNumber(phone)) {
        return {
          row: i + 1,
          phone: data[i][0],
          name: data[i][1] || '',
          alamat: data[i][2] || '',
          state: data[i][5] || '',
          last_activity: data[i][6] || null
        };
      }
    }
  } catch (err) {
    logToSheet("ERROR getCustomer:", err.toString());
  }
  return null;
}

function saveNewCustomer(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return;
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      const existingPhone = normalizeNumber(String(data[i][0]));
      if (existingPhone === normalizedPhone) {
        const row = i + 1;
        sh.getRange(row, 6).setValue(STATE_WAIT_NAME);
        sh.getRange(row, 7).setValue(new Date());
        sh.getRange(row, 9).setValue(new Date());
        logToSheet("Customer updated (already exists):", phone);
        return;
      }
    }
    
    sh.appendRow([phone, "", "", "", "", STATE_WAIT_NAME, new Date(), new Date(), new Date()]);
    logToSheet("New customer created:", phone);
  } catch (err) {
    logToSheet("ERROR saveNewCustomer:", err.toString());
  }
}

function updateCustomer(phone, name, state) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        const row = i + 1;
        if (name) sh.getRange(row, 2).setValue(name);
        if (state) sh.getRange(row, 6).setValue(state);
        sh.getRange(row, 7).setValue(new Date());
        sh.getRange(row, 9).setValue(new Date());
        return;
      }
    }
  } catch (err) {
    logToSheet("ERROR updateCustomer:", err.toString());
  }
}

function updateCustomerState(phone, state) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        const row = i + 1;
        sh.getRange(row, 6).setValue(state);
        sh.getRange(row, 7).setValue(new Date());
        sh.getRange(row, 9).setValue(new Date());
        return;
      }
    }
  } catch (err) {
    logToSheet("ERROR updateCustomerState:", err.toString());
  }
}

function updateLastActivity(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        sh.getRange(i + 1, 7).setValue(new Date());
        return;
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

// ==================================================
// SEND WHATSAPP
// ==================================================
function sendWA(to, message) {
  try {
    const payload = { device_id: DEVICE_ID, number: to, message: message };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30
    };
    
    const response = UrlFetchApp.fetch(WA_API, options);
    return response.getResponseCode();
  } catch (err) {
    logToSheet("ERROR sendWA:", err.toString());
    return 0;
  }
}

function normalizeNumber(num) {
  if (!num) return "";
  let phone = String(num).replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  if (!phone.startsWith("62")) phone = "62" + phone;
  return phone;
}

// ==================================================
// ADMIN FUNCTIONS
// ==================================================
function getConfig() {
  const location = getLocation();
  const settings = getSettings();
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    nama_toko: location.nama_toko,
    base_shipping_cost: settings.base_shipping_cost,
    shipping_cost_per_km: settings.shipping_cost_per_km,
    free_shipping_min_distance: settings.free_shipping_min_distance
  };
}

function getSettings() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    if (!sh) {
      return { base_shipping_cost: 10000, shipping_cost_per_km: 2000, free_shipping_min_distance: 5 };
    }
    const rows = sh.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < rows.length; i++) {
      const key = String(rows[i][0] || '').toLowerCase().trim();
      const value = rows[i][1];
      if (key === 'base_shipping_cost' || key.includes('base')) {
        settings.base_shipping_cost = Number(value) || 10000;
      }
      if (key === 'shipping_cost_per_km' || key.includes('per km')) {
        settings.shipping_cost_per_km = Number(value) || 2000;
      }
      if (key === 'free_shipping_min_distance') {
        settings.free_shipping_min_distance = Number(value) || 5;
      }
    }
    return {
      base_shipping_cost: settings.base_shipping_cost || 10000,
      shipping_cost_per_km: settings.shipping_cost_per_km || 2000,
      free_shipping_min_distance: settings.free_shipping_min_distance || 5
    };
  } catch (err) {
    return { base_shipping_cost: 10000, shipping_cost_per_km: 2000, free_shipping_min_distance: 5 };
  }
}

// ==================================================
// CUSTOM CONFIG (CONFIG sheet) + ADMIN AUTH
// ==================================================
function getCustomConfig() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName('CONFIG');
    if (!sh) return {};
    const rows = sh.getDataRange().getValues();
    const config = {};
    for (let i = 1; i < rows.length; i++) {
      const key = String(rows[i][0] || '').trim();
      const value = rows[i][1];
      config[key] = value;
    }
    return config;
  } catch (err) {
    return {};
  }
}

function saveCustomConfigObj(obj) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName('CONFIG');
    if (!sh) sh = ss.insertSheet('CONFIG');
    sh.clear();
    sh.appendRow(['Key', 'Value', 'UpdatedAt']);
    for (const k in obj) {
      sh.appendRow([k, obj[k], new Date()]);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function adminLogin(password) {
  try {
    const cfg = getCustomConfig();
    const adminPass = String(cfg['admin_password'] || cfg['ADMIN_PASSWORD'] || '');
    if (!adminPass) return { success: false, error: 'No admin password set' };
    if (String(password) !== String(adminPass)) return { success: false, error: 'Invalid password' };

    // Generate token and store session in ScriptProperties with 2h expiry
    const token = Utilities.getUuid();
    const expires = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
    const session = { token: token, expires: expires };
    PropertiesService.getScriptProperties().setProperty('ADMIN_SESSION', JSON.stringify(session));
    return { success: true, token: token, expires: expires };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function verifyAdminToken(token) {
  try {
    const s = PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION');
    if (!s) return false;
    const session = JSON.parse(s);
    if (session.token !== token) return false;
    if (Date.now() > session.expires) return false;
    return true;
  } catch (err) {
    return false;
  }
}

// ==================================================
// API KEY HELPER (reads from CONFIG sheet)
// ==================================================
function getAPIKey(keyName, fallback = '') {
  try {
    const cfg = getCustomConfig();
    const value = cfg[keyName] || cfg[keyName.toUpperCase()] || fallback;
    if (!value && fallback) return fallback;
    return String(value);
  } catch (err) {
    Logger.log('Error reading API key ' + keyName + ': ' + err.toString());
    return fallback;
  }
}

// ==================================================
// INPUT VALIDATION & SANITIZATION
// ==================================================
function sanitizeString(str, maxLength = 255) {
  if (!str) return '';
  str = String(str).trim();
  // Remove potentially dangerous HTML/JS
  str = str.replace(/[<>\"']/g, '');
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  return str;
}

function validateEmail(email) {
  email = String(email).trim().toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 255;
}

function validatePhone(phone) {
  phone = String(phone).trim().replace(/\D/g, '');
  return phone.length >= 10 && phone.length <= 15;
}

function sanitizePhoneNumber(phone) {
  phone = String(phone || '').replace(/\D/g, '');
  // Ensure starts with 62 for Indonesia
  if (phone.startsWith('0')) {
    phone = '62' + phone.substring(1);
  } else if (!phone.startsWith('62')) {
    phone = '62' + phone;
  }
  return phone;
}

function validatePrice(price) {
  const p = Number(price);
  return !isNaN(p) && p >= 0 && p <= 9999999;
}

function validateMenuData(data) {
  const errors = [];
  if (!sanitizeString(data.nama, 100).trim()) errors.push('Menu name required');
  if (!validatePrice(data.harga)) errors.push('Invalid price');
  if (data.diskon_persen && (Number(data.diskon_persen) < 0 || Number(data.diskon_persen) > 100)) {
    errors.push('Discount must be 0-100%');
  }
  return { isValid: errors.length === 0, errors: errors };
}

function validateOrderData(data) {
  const errors = [];
  if (!sanitizeString(data.customer_name, 100).trim()) errors.push('Customer name required');
  if (!validatePhone(data.customer_phone)) errors.push('Invalid phone number');
  if (!sanitizeString(data.customer_address, 500).trim()) errors.push('Address required');
  if (!validatePrice(data.total)) errors.push('Invalid total amount');
  if (!['pending', 'confirmed', 'delivered', 'canceled'].includes(data.status)) {
    errors.push('Invalid status');
  }
  return { isValid: errors.length === 0, errors: errors };
}

// ==================================================
// PAYMENT GATEWAY INTEGRATION (Server-side)
// ==================================================
function createMidtransPayment(orderId, amount, customer_email, customer_phone) {
  try {
    const midtransKey = getAPIKey('midtrans_key', '');
    if (!midtransKey) {
      return { success: false, error: 'Midtrans not configured' };
    }

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(amount)
      },
      customer_details: {
        email: sanitizeString(customer_email, 100),
        phone: sanitizePhoneNumber(customer_phone)
      }
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(midtransKey + ':'),
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://app.midtrans.com/api/v1/transactions', options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 201) {
      Logger.log('Midtrans payment created: ' + orderId);
      return { 
        success: true, 
        payment_url: result.redirect_url,
        transaction_id: result.transaction_id
      };
    } else {
      Logger.log('Midtrans error: ' + response.getContentText());
      return { 
        success: false, 
        error: result.error_message || 'Payment creation failed'
      };
    }
  } catch (err) {
    Logger.log('Midtrans exception: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

function createStripePayment(orderId, amount, customer_email) {
  try {
    const stripeKey = getAPIKey('stripe_key', '');
    if (!stripeKey) {
      return { success: false, error: 'Stripe not configured' };
    }

    // Create Stripe Checkout Session
    const payload = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'idr',
          unit_amount: Number(amount) * 100, // Stripe uses cents
          product_data: {
            name: 'Feisty Order ' + orderId
          }
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: getAPIKey('base_url', 'https://example.com') + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: getAPIKey('base_url', 'https://example.com') + '/cancel',
      customer_email: sanitizeString(customer_email, 100)
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + stripeKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: new URLSearchParams(flattenObject('', payload)).toString(),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      Logger.log('Stripe payment created: ' + orderId);
      return { 
        success: true, 
        payment_url: result.url,
        session_id: result.id
      };
    } else {
      Logger.log('Stripe error: ' + response.getContentText());
      return { 
        success: false, 
        error: result.error?.message || 'Payment creation failed'
      };
    }
  } catch (err) {
    Logger.log('Stripe exception: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

// Helper to flatten nested object for FormData
function flattenObject(prefix, obj) {
  const result = {};
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? prefix + '[' + key + ']' : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(newKey, value));
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        result[newKey + '[' + idx + ']'] = item;
      });
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

// ==================================================
// LOGGING & MONITORING
// ==================================================
const LOGS_SHEET = 'Logs';

function initLogsSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName(LOGS_SHEET);
    if (!sh) {
      sh = ss.insertSheet(LOGS_SHEET);
    }
    const headers = ['Timestamp', 'Type', 'Action', 'Details', 'Status', 'Error'];
    if (sh.getLastRow() <= 1) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F0F0F0');
    }
    return sh;
  } catch (err) {
    Logger.log('Error initializing logs: ' + err);
    return null;
  }
}

function logActivity(type, action, details, status = 'success', error = '') {
  try {
    const sh = initLogsSheet();
    if (!sh) return;

    sh.appendRow([
      new Date(),
      sanitizeString(type, 50),
      sanitizeString(action, 100),
      sanitizeString(details, 500),
      status,
      sanitizeString(error, 300)
    ]);

    // Keep only last 1000 rows for performance
    if (sh.getLastRow() > 1005) {
      sh.deleteRows(2, 5);
    }
  } catch (err) {
    Logger.log('Error logging activity: ' + err);
  }
}

function sendEmailNotification(subject, message, recipient = null) {
  try {
    const emailBackend = getAPIKey('email_backend', '');
    if (!emailBackend) {
      Logger.log('Email backend not configured');
      return false;
    }

    recipient = recipient || emailBackend;
    const options = {
      name: 'Feisty Bot',
      replyTo: emailBackend
    };

    MailApp.sendEmail(recipient, subject, message, options);
    logActivity('EMAIL', 'send', recipient, 'success');
    return true;
  } catch (err) {
    Logger.log('Error sending email: ' + err);
    logActivity('EMAIL', 'send', recipient, 'failed', err.toString());
    return false;
  }
}

function retryFetch(url, options, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        return { success: true, response: response };
      }
      lastError = 'HTTP ' + response.getResponseCode();
    } catch (err) {
      lastError = err.toString();
      if (i < maxRetries - 1) {
        Utilities.sleep(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  return { success: false, error: lastError };
}

function getMenu() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) return { error: 'Sheet not found: ' + MENU_SHEET };
    const rows = sh.getDataRange().getValues();
    if (rows.length === 0) return { error: 'Sheet kosong' };
    const header = rows.shift().map(h => h.toString().toLowerCase().trim());
    const idx = col => header.indexOf(col);
    const items = rows
      .filter(r => {
        const aktif = r[idx('aktif')];
        const aktifStr = String(aktif).toLowerCase();
        return aktif === true || aktif === 'true' || aktif === 'TRUE' || aktif === 1 || aktifStr === 'true';
      })
      .map((r, i) => {
        const harga = Number(r[idx('harga')]) || 0;
        const hargaAsli = Number(r[idx('harga_asli')]) || 0;
        const diskonPersen = Number(r[idx('diskon_persen')]) || 0;
        let hargaDiskon = harga;
        if (hargaAsli > 0 && hargaAsli > harga) {
          hargaDiskon = harga;
        } else if (diskonPersen > 0) {
          hargaDiskon = Math.round(harga * (100 - diskonPersen) / 100);
        }
        return {
          id: i + 1,
          nama: r[idx('nama')] || '',
          deskripsi: r[idx('deskripsi')] || '',
          harga: harga,
          harga_asli: hargaAsli,
          diskon_persen: diskonPersen,
          harga_diskon: hargaDiskon,
          kategori: r[idx('kategori')] || 'Lainnya',
          gambar: r[idx('gambar')] || '',
          has_discount: hargaAsli > harga || diskonPersen > 0
        };
      });
    return items;
  } catch (err) {
    return { error: err.toString() };
  }
}

function getLocation() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOCATION_SHEET);
    if (!sh) {
      return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    }
    const rows = sh.getDataRange().getValues();
    if (rows.length < 2) {
      return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    }
    return {
      nama_toko: String(rows[1][0] || 'Feisty Kitchen'),
      latitude: Number(rows[1][1]) || -6.2088,
      longitude: Number(rows[1][2]) || 106.8456
    };
  } catch (err) {
    return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
  }
}

function getCustomerByPhone(phone) {
  try {
    if (!phone) return null;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return null;
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    for (let i = 1; i < data.length; i++) {
      const rowPhone = normalizeNumber(String(data[i][0] || ""));
      if (rowPhone === normalizedPhone) {
        return {
          phone: data[i][0],
          nama: data[i][1] || '',
          alamat: data[i][2] || '',
          tipe_diskon: data[i][3] || '',
          nilai_diskon: Number(data[i][4]) || 0
        };
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}

// ==================================================
// HANDLE ORDER DARI INDEX.HTML
// ==================================================
function handleOrderFromIndex(orderData) {
  try {
    const orderId = sanitizeString(orderData.order_id || "", 50);
    const phone = sanitizePhoneNumber(orderData.customer_phone || "");
    const name = sanitizeString(orderData.customer_name || "Pelanggan", 100);
    const address = sanitizeString(orderData.customer_address || "", 500);
    const items = orderData.items || [];
    const subtotal = Number(orderData.subtotal) || 0;
    const shippingCost = Number(orderData.shipping_cost) || 0;
    const discount = Number(orderData.discount) || 0;
    const total = Number(orderData.total) || 0;
    const method = sanitizeString(orderData.payment_method || "COD", 50);
    
    // Validate critical fields
    if (!phone || !validatePrice(total)) {
      Logger.log('Invalid order data: phone=' + phone + ', total=' + total);
      return;
    }
    
    if (orderId && PROCESSED_ORDER_IDS[orderId]) return;
    if (orderId) PROCESSED_ORDER_IDS[orderId] = true;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    const itemsStr = JSON.stringify(items.map(i => ({ 
      name: sanitizeString(i.name, 100), 
      qty: Number(i.qty) || 1, 
      price: Number(i.price) || 0 
    })));
    
    sh.appendRow([
      new Date(), phone, name, address, itemsStr, 
      subtotal, shippingCost, discount, total, method, orderId, 'PENDING'
    ]);

    // Log order creation
    logActivity('ORDER', 'create', `Order ${orderId} from ${name}`, 'success');
    
    const itemsList = items
      .map(i => `• ${sanitizeString(i.name, 50)} x${Number(i.qty)||1} = Rp ${((Number(i.price)||0) * (Number(i.qty)||1)).toLocaleString('id-ID')}`)
      .join('\n');
    
    const msgCustomer = `✅ *Pesanan Diterima!*

Halo Kak *${name}*

📋 *Detail:*
${itemsList}

💰 *Subtotal: Rp ${subtotal.toLocaleString('id-ID')}*
🚚 *Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}*
${discount > 0 ? `🎁 *Diskon: Rp ${discount.toLocaleString('id-ID')}*\n` : ''}💳 *Total: Rp ${total.toLocaleString('id-ID')}*
💳 *Metode: ${method}*

🆔 Order ID: ${orderId}

Terima kasih! 🙏`;
    
    const sendResult = sendWA(phone, msgCustomer);
    logActivity('WA', 'send_customer_notification', orderId, sendResult ? 'success' : 'failed');
    Utilities.sleep(1000);
    
    const msgAdmin = `🔔 *PESANAN BARU*

👤 *Nama:* ${name}
📱 *WA:* ${phone}
📍 *Alamat:* ${address}
💳 *Metode:* ${method}

📋 *Detail:*
${itemsList}

💰 *Subtotal: Rp ${subtotal.toLocaleString('id-ID')}*
🚚 *Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}*
${discount > 0 ? `🎁 *Diskon: Rp ${discount.toLocaleString('id-ID')}*\n` : ''}💰 *Total: Rp ${total.toLocaleString('id-ID')}*
🆔 ${orderId}`;
    
    const adminResult = sendWA(ADMIN_PHONE, msgAdmin);
    logActivity('WA', 'send_admin_notification', orderId, adminResult ? 'success' : 'failed');
    
  } catch (err) {
    logActivity('ORDER', 'create', orderData?.order_id || 'unknown', 'failed', err.toString());
  }
}

// ==================================================
// ADMIN CRUD FUNCTIONS
// ==================================================
function getOrders() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map(row => ({
      timestamp: row[0],
      phone: String(row[1] || ''),
      nama: String(row[2] || ''),
      alamat: String(row[3] || ''),
      items: String(row[4] || '[]'),
      subtotal: Number(row[5]) || 0,
      shipping_cost: Number(row[6]) || 0,
      diskon: Number(row[7]) || 0,
      total: Number(row[8]) || 0,
      payment_method: String(row[9] || ''),
      order_id: String(row[10] || ''),
      status: String(row[11] || 'PENDING')
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function getAllCustomers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map(row => ({
      phone: String(row[0] || ''),
      nama: String(row[1] || ''),
      alamat: String(row[2] || ''),
      tipe_diskon: String(row[3] || ''),
      nilai_diskon: Number(row[4]) || 0,
      state: String(row[5] || ''),
      last_activity: row[6],
      created_at: row[7],
      updated_at: row[8]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function updateOrderStatus(orderId, newStatus) {
  try {
    if (!orderId || !newStatus) {
      return { success: false, message: 'Order ID dan status diperlukan' };
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    if (!sh) {
      return { success: false, message: 'Sheet pesanan tidak ditemukan' };
    }
    const data = sh.getDataRange().getValues();
    let orderRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][10]) === String(orderId)) {
        orderRow = i + 1;
        break;
      }
    }
    if (orderRow === -1) {
      return { success: false, message: 'Pesanan tidak ditemukan' };
    }
    const currentStatus = data[orderRow - 1][11];
    const customerPhone = data[orderRow - 1][1];
    const customerName = data[orderRow - 1][2];
    const orderTotal = data[orderRow - 1][8];
    sh.getRange(orderRow, 12).setValue(newStatus);
    
    const statusMessages = {
      'PENDING': 'Pesanan Anda telah DITERIMA dan akan segera diproses.',
      'PROCESSING': 'Pesanan Anda sedang DIPROSES dan disiapkan.',
      'SHIPPING': '🚚 Pesanan Anda sedang DALAM PENGIRIMAN!',
      'COMPLETED': '✅ Pesanan Anda telah SELESAI. Terima kasih!',
      'CANCELLED': '❌ Pesanan Anda telah DIBATALKAN.'
    };
    
    const msg = `📋 *Update Pesanan ${orderId}*

Halo *${customerName}*,
${statusMessages[newStatus] || 'Status berubah menjadi: ' + newStatus}

💰 Total: Rp ${Number(orderTotal).toLocaleString('id-ID')}

Terima kasih! 🙏`;
    
    sendWA(customerPhone, msg);
    
    return { 
      success: true, 
      message: 'Status berhasil diubah',
      previousStatus: currentStatus,
      newStatus: newStatus
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// MENU CRUD FUNCTIONS
// ==================================================
function addMenuItem(data) {
  try {
    // Validate input
    const validation = validateMenuData(data);
    if (!validation.isValid) {
      return { success: false, message: 'Validation error: ' + validation.errors.join(', ') };
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) return { success: false, message: 'Menu sheet tidak ditemukan' };
    
    // Sanitize inputs
    sh.appendRow([
      sanitizeString(data.nama, 100),
      sanitizeString(data.deskripsi, 500),
      Number(data.harga) || 0,
      Number(data.harga_asli) || 0,
      Math.max(0, Math.min(100, Number(data.diskon_persen) || 0)),
      sanitizeString(data.kategori || 'Lainnya', 50),
      sanitizeString(data.gambar, 300),
      data.aktif !== false,
      Number(data.urutan) || 0
    ]);
    return { success: true, message: 'Menu item berhasil ditambahkan' };
  } catch (err) {
    Logger.log('Error in addMenuItem: ' + err.toString());
    return { success: false, message: err.toString() };
  }
}

function updateMenuItem(index, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) return { success: false, message: 'Menu sheet tidak ditemukan' };
    
    const row = parseInt(index) + 2;
    sh.getRange(row, 1).setValue(data.nama || '');
    sh.getRange(row, 2).setValue(data.deskripsi || '');
    sh.getRange(row, 3).setValue(data.harga || 0);
    sh.getRange(row, 4).setValue(data.harga_asli || 0);
    sh.getRange(row, 5).setValue(data.diskon_persen || 0);
    sh.getRange(row, 6).setValue(data.kategori || 'Lainnya');
    sh.getRange(row, 7).setValue(data.gambar || '');
    sh.getRange(row, 8).setValue(data.aktif !== false);
    sh.getRange(row, 9).setValue(data.urutan || 0);
    return { success: true, message: 'Menu item berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteMenuItem(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) return { success: false, message: 'Menu sheet tidak ditemukan' };
    
    const row = parseInt(rowNumber) + 1;
    sh.deleteRow(row);
    return { success: true, message: 'Menu item berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CUSTOMER CRUD FUNCTIONS
// ==================================================
function addCustomer(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return { success: false, message: 'Customers sheet tidak ditemukan' };
    
    sh.appendRow([
      data.phone || '',
      data.nama || '',
      data.alamat || '',
      data.tipe_diskon || '',
      data.nilai_diskon || 0,
      STATE_CONVERSATION,
      new Date(),
      new Date(),
      new Date()
    ]);
    return { success: true, message: 'Customer berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateCustomerByPhone(oldPhone, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return { success: false, message: 'Customers sheet tidak ditemukan' };
    
    const dataRange = sh.getDataRange();
    const values = dataRange.getValues();
    const normalizedOldPhone = normalizeNumber(oldPhone);
    let row = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (normalizeNumber(String(values[i][0])) === normalizedOldPhone) {
        row = i + 1;
        break;
      }
    }
    
    if (row === -1) return { success: false, message: 'Customer tidak ditemukan' };
    
    sh.getRange(row, 1).setValue(data.phone || '');
    sh.getRange(row, 2).setValue(data.nama || '');
    sh.getRange(row, 3).setValue(data.alamat || '');
    sh.getRange(row, 4).setValue(data.tipe_diskon || '');
    sh.getRange(row, 5).setValue(data.nilai_diskon || 0);
    sh.getRange(row, 9).setValue(new Date());
    return { success: true, message: 'Customer berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteCustomerByPhone(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return { success: false, message: 'Customers sheet tidak ditemukan' };
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    let rowToDelete = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizedPhone) {
        rowToDelete = i + 1;
        break;
      }
    }
    
    if (rowToDelete === -1) return { success: false, message: 'Customer tidak ditemukan' };
    
    sh.deleteRow(rowToDelete);
    return { success: true, message: 'Customer berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// SETTINGS & LOCATION FUNCTIONS
// ==================================================
function updateSetting(key, value) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    if (!sh) return { success: false, message: 'Pengaturan sheet tidak ditemukan' };
    
    const data = sh.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(key).toLowerCase()) {
        sh.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    
    if (!found) sh.appendRow([key, value, '']);
    return { success: true, message: 'Pengaturan berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateLocation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOCATION_SHEET);
    if (!sh) return { success: false, message: 'Lokasi sheet tidak ditemukan' };
    
    sh.getRange(2, 1).setValue(data.nama_toko || 'Feisty Kitchen');
    sh.getRange(2, 2).setValue(data.latitude || -6.2088);
    sh.getRange(2, 3).setValue(data.longitude || 106.8456);
    return { success: true, message: 'Lokasi berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CS KNOWLEDGE CRUD
// ==================================================
function addCSKnowledge(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    
    sh.appendRow([
      data.kategori || '',
      data.keywords || '',
      data.jawaban || '',
      data.contoh_pertanyaan || ''
    ]);
    return { success: true, message: 'Pengetahuan CS berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateCSKnowledge(rowNumber, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    
    const row = parseInt(rowNumber) + 2;
    sh.getRange(row, 1).setValue(data.kategori || '');
    sh.getRange(row, 2).setValue(data.keywords || '');
    sh.getRange(row, 3).setValue(data.jawaban || '');
    sh.getRange(row, 4).setValue(data.contoh_pertanyaan || '');
    return { success: true, message: 'Pengetahuan CS berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteCSKnowledge(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    
    const row = parseInt(rowNumber) + 1;
    sh.deleteRow(row);
    return { success: true, message: 'Pengetahuan CS berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getAllCSKnowledge() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return [];
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const rows = data.slice(1);
    return rows.map((row, i) => ({
      row: i,
      kategori: String(row[0] || ''),
      keywords: String(row[1] || ''),
      jawaban: String(row[2] || ''),
      contoh_pertanyaan: String(row[3] || '')
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// QUICK TEST & DEBUG FUNCTIONS
// ==================================================
function testWA() {
  const msg = '🧪 *TEST WHATSAPP*\n\n' +
    'Waktu: ' + new Date().toLocaleString('id-ID') + '\n' +
    'Device ID: ' + DEVICE_ID + '\n' +
    'API: ' + WA_API + '\n\n' +
    'Jika pesan ini diterima, konfigurasi WA sudah benar!';
  
  const result = sendWA(ADMIN_PHONE, msg);
  return 'Test WA sent. Response: ' + result;
}

function testAI() {
  const customer = { name: 'Tester', phone: ADMIN_PHONE };
  const response = getAIResponse('Apa itu Feisty dan menu apa yang ada?', customer);
  return {
    question: 'Apa itu Feisty dan menu apa yang ada?',
    response: response,
    timestamp: new Date().toISOString()
  };
}

// Test context detection
function testContextDetection() {
  const testMessages = [
    "Mau pesan 2 nasi goreng dan 1 jus jeruk",
    "Berapa biaya ongkir ke daerah saya?",
    "Saya dari GoFood CS, ada yang bisa dibantu?",
    "Kemarin makan disini enak banget!",
    "Hari ini cuaca cerah ya",
    "Bisa bayar pake gopay?",
    "Teman saya nyari jasa grafis",
    "Ada promo untuk pembelian hari ini?",
    "Saya admin dari perusahaan lain",
    "Menu vegetarian ada gak?",
    "Jam operasional berapa saja?",
    "Pinjam uang bisa gak?",
    "Ini yang terbaik untuk makan siang"
  ];
  
  const results = testMessages.map(msg => {
    const detection = detectConversationContext(msg, { name: 'Test' });
    return {
      message: msg,
      isFeistyRelated: detection.isFeistyRelated,
      category: detection.category,
      confidence: detection.confidence.toFixed(2),
      reason: detection.reason
    };
  });
  
  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    results: results
  };
}

// Test menu detection
function testMenuDetection() {
  const testQueries = [
    "menu",
    "lihat menu",
    "menu apa saja?",
    "ada menu apa",
    "tampilkan menu",
    "foto produk",
    "lihat foto makanan",
    "gambar produk apa ada",
    "katalog",
    "daftar menu",
    "harga",
    "price list"
  ];
  
  const results = testQueries.map(query => ({
    query: query,
    isMenuRequest: isMenuRequest(query.toLowerCase())
  }));
  
  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    menuRequestTests: results
  };
}

// Test full menu sending
function testSendMenu() {
  const customer = { 
    name: 'Tester', 
    phone: ADMIN_PHONE 
  };
  
  const menu = getMenuFormatted();
  
  return {
    timestamp: new Date().toISOString(),
    customerName: customer.name,
    totalMenuItems: menu.length,
    categoriesCount: [...new Set(menu.map(m => m.kategori))].length,
    sample: menu.slice(0, 3).map(m => ({
      nama: m.nama,
      kategori: m.kategori,
      harga: m.harga,
      harga_diskon: m.harga_diskon,
      gambar: m.gambar ? 'Ada' : 'Tidak ada'
    }))
  };
}

// ==================================================
// MULTI-USER ADMIN MANAGEMENT (NEW v2.1)
// ==================================================
function getAllAdminUsers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ADMIN_USERS_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    return data.slice(1).map((row, i) => ({
      row: i + 1,
      username: String(row[0] || ''),
      role: String(row[2] || 'staff'),
      nama_lengkap: String(row[3] || ''),
      email: String(row[4] || ''),
      aktif: row[5] === true || row[5] === 'true',
      created_at: row[6],
      last_login: row[7]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function addAdminUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ADMIN_USERS_SHEET);
    if (!sh) return { success: false, message: 'Admin sheet not found' };
    
    // Check if username already exists
    const existing = getAllAdminUsers();
    if (Array.isArray(existing) && existing.some(u => u.username === data.username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    sh.appendRow([
      data.username,
      Utilities.base64Encode(String(data.password)),
      data.role || 'staff',
      data.nama_lengkap || '',
      data.email || '',
      data.aktif !== false,
      new Date(),
      ''
    ]);
    return { success: true, message: 'Admin user added successfully' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateAdminUser(rowNumber, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ADMIN_USERS_SHEET);
    if (!sh) return { success: false, message: 'Admin sheet not found' };
    
    const row = parseInt(rowNumber) + 1;
    if (data.username) sh.getRange(row, 1).setValue(data.username);
    if (data.password) sh.getRange(row, 2).setValue(Utilities.base64Encode(String(data.password)));
    if (data.role) sh.getRange(row, 3).setValue(data.role);
    if (data.nama_lengkap) sh.getRange(row, 4).setValue(data.nama_lengkap);
    if (data.email) sh.getRange(row, 5).setValue(data.email);
    if (data.aktif !== undefined) sh.getRange(row, 6).setValue(data.aktif);
    
    return { success: true, message: 'Admin user updated successfully' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteAdminUser(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ADMIN_USERS_SHEET);
    if (!sh) return { success: false, message: 'Admin sheet not found' };
    
    const row = parseInt(rowNumber) + 1;
    sh.deleteRow(row);
    return { success: true, message: 'Admin user deleted successfully' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Multi-user login with role support
function adminLoginMulti(username, password) {
  try {
    const users = getAllAdminUsers();
    if (!Array.isArray(users)) return { success: false, error: 'Database error' };
    
    const user = users.find(u => 
      u.username === username && 
      u.aktif === true
    );
    
    if (!user) return { success: false, error: 'User not found or inactive' };
    
    // Get stored password hash
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ADMIN_USERS_SHEET);
    const data = sh.getDataRange().getValues();
    let storedHash = '';
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === username) {
        storedHash = String(data[i][1] || '');
        break;
      }
    }
    
    const inputHash = Utilities.base64Encode(password);
    if (inputHash !== storedHash) return { success: false, error: 'Invalid password' };
    
    // Generate token with role
    const token = Utilities.getUuid();
    const expires = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
    const session = { 
      token: token, 
      expires: expires,
      username: username,
      role: user.role,
      nama_lengkap: user.nama_lengkap
    };
    PropertiesService.getScriptProperties().setProperty('ADMIN_SESSION', JSON.stringify(session));
    
    // Update last login
    sh.getRange(user.row + 1, 8).setValue(new Date());
    
    return { 
      success: true, 
      token: token, 
      expires: expires,
      role: user.role,
      username: username,
      nama_lengkap: user.nama_lengkap
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// Role-based access check
function hasRole(requiredRole) {
  try {
    const s = PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION');
    if (!s) return false;
    const session = JSON.parse(s);
    if (Date.now() > session.expires) return false;
    
    const roleHierarchy = { 'owner': 3, 'manager': 2, 'staff': 1 };
    const userLevel = roleHierarchy[session.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  } catch (err) {
    return false;
  }
}

// ==================================================
// INVENTORY MANAGEMENT (NEW v2.1)
// ==================================================
function getInventory() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(INVENTORY_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    return data.slice(1).map((row, i) => ({
      row: i,
      menu_id: row[0],
      nama_menu: String(row[1] || ''),
      stok: Number(row[2]) || 0,
      satuan: String(row[3] || 'pcs'),
      stok_min: Number(row[4]) || 0,
      stok_max: Number(row[5]) || 0,
      updated_at: row[6]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function addInventoryItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(INVENTORY_SHEET);
    if (!sh) return { success: false, message: 'Inventory sheet not found' };
    
    sh.appendRow([
      data.menu_id || '',
      data.nama_menu || '',
      Number(data.stok) || 0,
      data.satuan || 'pcs',
      Number(data.stok_min) || 0,
      Number(data.stok_max) || 0,
      new Date()
    ]);
    return { success: true, message: 'Inventory item added' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateInventoryItem(rowNumber, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(INVENTORY_SHEET);
    if (!sh) return { success: false, message: 'Inventory sheet not found' };
    
    const row = parseInt(rowNumber) + 2;
    if (data.menu_id !== undefined) sh.getRange(row, 1).setValue(data.menu_id);
    if (data.nama_menu !== undefined) sh.getRange(row, 2).setValue(data.nama_menu);
    if (data.stok !== undefined) sh.getRange(row, 3).setValue(Number(data.stok));
    if (data.satuan !== undefined) sh.getRange(row, 4).setValue(data.satuan);
    if (data.stok_min !== undefined) sh.getRange(row, 5).setValue(Number(data.stok_min));
    if (data.stok_max !== undefined) sh.getRange(row, 6).setValue(Number(data.stok_max));
    sh.getRange(row, 7).setValue(new Date());
    
    return { success: true, message: 'Inventory updated' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteInventoryItem(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(INVENTORY_SHEET);
    if (!sh) return { success: false, message: 'Inventory sheet not found' };
    
    const row = parseInt(rowNumber) + 2;
    sh.deleteRow(row);
    return { success: true, message: 'Inventory item deleted' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Auto-reduce stock when order is placed
function reduceStock(items) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(INVENTORY_SHEET);
    if (!sh) return { success: false, message: 'Inventory not configured' };
    
    const data = sh.getDataRange().getValues();
    const results = [];
    
    items.forEach(item => {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase().includes(String(item.name).toLowerCase())) {
          const currentStock = Number(data[i][2]) || 0;
          const newStock = Math.max(0, currentStock - (Number(item.qty) || 1));
          sh.getRange(i + 1, 3).setValue(newStock);
          sh.getRange(i + 1, 7).setValue(new Date());
          results.push({ item: item.name, old: currentStock, new: newStock });
          break;
        }
      }
    });
    
    return { success: true, results: results };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Get low stock alerts
function getLowStockAlerts() {
  try {
    const inventory = getInventory();
    if (!Array.isArray(inventory)) return [];
    
    return inventory.filter(item => item.stok <= item.stok_min && item.stok_min > 0);
  } catch (err) {
    return [];
  }
}

// ==================================================
// CUSTOMER LOYALTY PROGRAM (NEW v2.1)
// ==================================================
function getLoyaltyPoints(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOYALTY_SHEET);
    if (!sh) return null;
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizedPhone) {
        return {
          phone: data[i][0],
          nama: data[i][1],
          total_poin: Number(data[i][2]) || 0,
          total_pemesanan: Number(data[i][3]) || 0,
          total_belanja: Number(data[i][4]) || 0,
          poin_dipakai: Number(data[i][5]) || 0,
          tier: String(data[i][6]) || 'bronze',
          created_at: data[i][7],
          updated_at: data[i][8]
        };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

function addLoyaltyPoints(phone, nama, totalOrder) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOYALTY_SHEET);
    if (!sh) return { success: false, message: 'Loyalty sheet not found' };
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    const pointsToAdd = Math.floor(totalOrder / 1000); // 1 point per 1000 IDR
    
    // Find existing customer
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizedPhone) {
        // Update existing
        const currentPoints = Number(data[i][2]) || 0;
        const currentOrders = Number(data[i][3]) || 0;
        const currentTotal = Number(data[i][4]) || 0;
        const newPoints = currentPoints + pointsToAdd;
        const newOrders = currentOrders + 1;
        const newTotal = currentTotal + totalOrder;
        
        // Determine tier
        let tier = 'bronze';
        if (newTotal >= 5000000) tier = 'platinum';
        else if (newTotal >= 2000000) tier = 'gold';
        else if (newTotal >= 500000) tier = 'silver';
        
        sh.getRange(i + 1, 3).setValue(newPoints);
        sh.getRange(i + 1, 4).setValue(newOrders);
        sh.getRange(i + 1, 5).setValue(newTotal);
        sh.getRange(i + 1, 7).setValue(tier);
        sh.getRange(i + 1, 9).setValue(new Date());
        
        return { 
          success: true, 
          pointsAdded: pointsToAdd, 
          newTotal: newPoints,
          tier: tier
        };
      }
    }
    
    // Create new loyalty record
    let tier = 'bronze';
    if (totalOrder >= 5000000) tier = 'platinum';
    else if (totalOrder >= 2000000) tier = 'gold';
    else if (totalOrder >= 500000) tier = 'silver';
    
    sh.appendRow([
      phone,
      nama,
      pointsToAdd,
      1,
      totalOrder,
      0,
      tier,
      new Date(),
      new Date()
    ]);
    
    return { 
      success: true, 
      pointsAdded: pointsToAdd, 
      newTotal: pointsToAdd,
      tier: tier
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function useLoyaltyPoints(phone, pointsToUse) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOYALTY_SHEET);
    if (!sh) return { success: false, message: 'Loyalty sheet not found' };
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizedPhone) {
        const currentPoints = Number(data[i][2]) || 0;
        const usedPoints = Number(data[i][5]) || 0;
        
        if (currentPoints < pointsToUse) {
          return { success: false, message: 'Insufficient points' };
        }
        
        sh.getRange(i + 1, 3).setValue(currentPoints - pointsToUse);
        sh.getRange(i + 1, 6).setValue(usedPoints + pointsToUse);
        sh.getRange(i + 1, 9).setValue(new Date());
        
        return { success: true, pointsUsed: pointsToUse };
      }
    }
    return { success: false, message: 'Customer not found' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getAllLoyaltyMembers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOYALTY_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    return data.slice(1).map((row, i) => ({
      row: i,
      phone: row[0],
      nama: String(row[1] || ''),
      total_poin: Number(row[2]) || 0,
      total_pemesanan: Number(row[3]) || 0,
      total_belanja: Number(row[4]) || 0,
      poin_dipakai: Number(row[5]) || 0,
      tier: String(row[6]) || 'bronze',
      created_at: row[7],
      updated_at: row[8]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// POS / CASHIER SYSTEM (NEW v2.1)
// ==================================================

// Get all tables
function getTables() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(TABLES_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    return data.slice(1).map((row, i) => ({
      row: i,
      nomor_meja: Number(row[0]) || 0,
      kapasitas: Number(row[1]) || 0,
      status: String(row[2]) || 'available',
      customer_name: String(row[3]) || '',
      created_at: row[4]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

// Update table status
function updateTableStatus(tableNumber, status, customerName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(TABLES_SHEET);
    if (!sh) return { success: false, message: 'Tables sheet not found' };
    
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === Number(tableNumber)) {
        sh.getRange(i + 1, 3).setValue(status || 'available');
        sh.getRange(i + 1, 4).setValue(customerName || '');
        if (status === 'available') {
          sh.getRange(i + 1, 5).setValue('');
        } else {
          sh.getRange(i + 1, 5).setValue(new Date());
        }
        return { success: true, message: 'Table updated' };
      }
    }
    return { success: false, message: 'Table not found' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Add new table
function addTable(capacity) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(TABLES_SHEET);
    if (!sh) return { success: false, message: 'Tables sheet not found' };
    
    const data = sh.getDataRange().getValues();
    const maxTable = data.length > 1 ? Math.max(...data.slice(1).map(r => Number(r[0]) || 0)) : 0;
    
    sh.appendRow([
      maxTable + 1,
      capacity || 4,
      'available',
      '',
      ''
    ]);
    
    return { success: true, message: 'Table added' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Delete table
function deleteTable(tableNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(TABLES_SHEET);
    if (!sh) return { success: false, message: 'Tables sheet not found' };
    
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === Number(tableNumber)) {
        sh.deleteRow(i + 1);
        return { success: true, message: 'Table deleted' };
      }
    }
    return { success: false, message: 'Table not found' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Create POS order
function createPOSOrder(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(POS_SHEET);
    if (!sh) return { success: false, message: 'POS sheet not found' };
    
    const transactionId = 'POS-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const items = JSON.stringify(data.items || []);
    const subtotal = Number(data.subtotal) || 0;
    const tax = Number(data.tax) || 0;
    const discount = Number(data.discount) || 0;
    const total = Number(data.total) || 0;
    const paymentMethod = data.payment_method || 'cash';
    const cash = Number(data.cash) || 0;
    const change = Math.max(0, cash - total);
    const cashier = data.cashier || 'Admin';
    const tableNumber = data.table_number || '';
    const orderType = data.type || 'dine-in';
    
    sh.appendRow([
      transactionId,
      new Date(),
      orderType,
      tableNumber,
      items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      cash,
      change,
      cashier,
      'completed',
      data.notes || ''
    ]);
    
    // Update table status if dine-in
    if (orderType === 'dine-in' && tableNumber) {
      updateTableStatus(tableNumber, 'available', '');
    }
    
    // Reduce inventory stock
    if (data.items && Array.isArray(data.items)) {
      reduceStock(data.items);
    }
    
    return {
      success: true,
      transaction_id: transactionId,
      change: change
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// Get POS transactions
function getPOSTransactions(dateFilter) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(POS_SHEET);
    if (!sh) return [];
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    
    let transactions = data.slice(1).map((row, i) => ({
      row: i,
      transaction_id: String(row[0] || ''),
      timestamp: row[1],
      type: String(row[2] || ''),
      table_number: String(row[3] || ''),
      items: String(row[4] || '[]'),
      subtotal: Number(row[5]) || 0,
      tax: Number(row[6]) || 0,
      discount: Number(row[7]) || 0,
      total: Number(row[8]) || 0,
      payment_method: String(row[9] || ''),
      cash: Number(row[10]) || 0,
      change: Number(row[11]) || 0,
      cashier: String(row[12] || ''),
      status: String(row[13] || ''),
      notes: String(row[14] || '')
    }));
    
    // Filter by date if provided
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      transactions = transactions.filter(t => {
        const txDate = new Date(t.timestamp);
        return txDate >= filterDate && txDate < nextDate;
      });
    }
    
    return transactions;
  } catch (err) {
    return { error: err.toString() };
  }
}

// Get POS daily report
function getPOSDailyReport(date) {
  try {
    const transactions = getPOSTransactions(date);
    if (!Array.isArray(transactions)) return { error: transactions.error };
    
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTransactions = transactions.length;
    const totalCash = transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + (t.cash || 0), 0);
    const totalCard = transactions.filter(t => t.payment_method === 'card').reduce((sum, t) => sum + (t.total || 0), 0);
    const totalQris = transactions.filter(t => t.payment_method === 'qris').reduce((sum, t) => sum + (t.total || 0), 0);
    
    // Item breakdown
    const itemCounts = {};
    transactions.forEach(t => {
      try {
        const items = JSON.parse(t.items || '[]');
        items.forEach(item => {
          const name = item.name || 'Unknown';
          itemCounts[name] = (itemCounts[name] || 0) + (Number(item.qty) || 1);
        });
      } catch (e) {}
    });
    
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      date: date || new Date().toISOString().split('T')[0],
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      payment_breakdown: {
        cash: totalCash,
        card: totalCard,
        qris: totalQris
      },
      top_items: topItems
    };
  } catch (err) {
    return { error: err.toString() };
  }
}

// Get POS summary (today)
function getPOSSummary() {
  try {
    const today = new Date().toISOString().split('T')[0];
    return getPOSDailyReport(today);
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// ANALYTICS DASHBOARD (NEW v2.1)
// ==================================================
function getAnalyticsDashboard() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get orders
    const orders = getOrders();
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    // Calculate metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Today's orders
    const todayOrders = ordersArray.filter(o => new Date(o.timestamp) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // This month's orders
    const monthOrders = ordersArray.filter(o => new Date(o.timestamp) >= thisMonth);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // Total revenue
    const totalRevenue = ordersArray.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // Order status breakdown
    const statusBreakdown = {};
    ordersArray.forEach(o => {
      const status = o.status || 'UNKNOWN';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    
    // Top selling items
    const itemCounts = {};
    ordersArray.forEach(order => {
      try {
        const items = JSON.parse(order.items || '[]');
        items.forEach(item => {
          const name = item.name || 'Unknown';
          itemCounts[name] = (itemCounts[name] || 0) + (Number(item.qty) || 1);
        });
      } catch (e) {}
    });
    
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Customer stats
    const customers = getAllCustomers();
    const customersArray = Array.isArray(customers) ? customers : [];
    
    // Loyalty members
    const loyaltyMembers = getAllLoyaltyMembers();
    const loyaltyArray = Array.isArray(loyaltyMembers) ? loyaltyMembers : [];
    
    // Low stock alerts
    const lowStock = getLowStockAlerts();
    
    return {
      summary: {
        total_orders: ordersArray.length,
        total_customers: customersArray.length,
        total_revenue: totalRevenue,
        today_orders: todayOrders.length,
        today_revenue: todayRevenue,
        month_orders: monthOrders.length,
        month_revenue: monthRevenue,
        loyalty_members: loyaltyArray.length
      },
      status_breakdown: statusBreakdown,
      top_selling_items: topItems,
      low_stock_alerts: lowStock,
      recent_orders: ordersArray.slice(-10).reverse()
    };
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// ORDER TRACKING (NEW v2.1)
// ==================================================
function trackOrder(orderId) {
  try {
    const orders = getOrders();
    if (!Array.isArray(orders)) return { error: 'Unable to fetch orders' };
    
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return { error: 'Order not found' };
    
    // Parse items
    let items = [];
    try {
      items = JSON.parse(order.items || '[]');
    } catch (e) {
      items = [];
    }
    
    return {
      success: true,
      order_id: order.order_id,
      status: order.status,
      customer: {
        nama: order.nama,
        phone: order.phone,
        alamat: order.alamat
      },
      items: items,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      diskon: order.diskon,
      total: order.total,
      payment_method: order.payment_method,
      timestamp: order.timestamp
    };
  } catch (err) {
    return { error: err.toString() };
  }
}

function viewLogs(limit = 20) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName('Logs');
    if (!sh) return 'Logs sheet not found';
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return 'No logs yet';
    
    const logs = data.slice(-limit);
    let output = '=== LAST ' + limit + ' LOGS ===\n\n';
    
    logs.forEach((row, i) => {
      if (i === 0) return;
      output += row[0] + ' | ' + row[1] + ': ' + String(row[2]).substring(0, 200) + '\n';
    });
    
    return output;
  } catch (err) {
    return 'Error: ' + err.toString();
  }
}

// ==================================================
// INFO FUNCTIONS
// ==================================================
function debugAll() {
  const results = {
    timestamp: new Date().toISOString(),
    bot_type: 'AI-MANAGED',
    spreadsheet: null,
    sheets: {},
    config: null,
    menu_count: 0,
    customers_count: 0,
    orders_count: 0,
    knowledge_count: 0,
    ai_status: 'ACTIVE',
    errors: []
  };
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    results.spreadsheet = {
      name: ss.getName(),
      id: ss.getId()
    };
    
    const sheetNames = ss.getSheets().map(s => s.getName());
    results.sheets.available = sheetNames;
    
    try {
      const menu = getMenu();
      results.menu_count = Array.isArray(menu) ? menu.length : 0;
    } catch (e) {
      results.errors.push('Menu: ' + e.toString());
    }
    
    try {
      const customers = getAllCustomers();
      results.customers_count = Array.isArray(customers) ? customers.length : 0;
    } catch (e) {
      results.errors.push('Customers: ' + e.toString());
    }
    
    try {
      const orders = getOrders();
      results.orders_count = Array.isArray(orders) ? orders.length : 0;
    } catch (e) {
      results.errors.push('Orders: ' + e.toString());
    }
    
    try {
      const kb = getAllCSKnowledge();
      results.knowledge_count = Array.isArray(kb) ? kb.length : 0;
    } catch (e) {
      results.errors.push('Knowledge: ' + e.toString());
    }
    
  } catch (err) {
    results.errors.push('Global: ' + err.toString());
  }
  
  return results;
}
