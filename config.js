/**
 * Feisty Global Configuration
 * File ini mengelola semua konfigurasi yang bisa diubah dari admin panel
 */

const FeistyConfig = {
    // Default values - bisa diubah di admin panel
    GAS_URL: localStorage.getItem('feisty_gas_url') || 'https://script.google.com/macros/s/1ntEFZH4kaT5gs9e58BEBPbykBZDp42TrzOiM0X3XfvIK0Lssw7lzAS_q/exec',
    SPREADSHEET_ID: localStorage.getItem('feisty_spreadsheet_id') || '1awdtyC3VsPX50xj8LKLk2LbNM7CNuCEv1jL1UbwLbXo',
    WHATSAPP_NUMBER: localStorage.getItem('feisty_whatsapp_number') || '6287787655880',
    GEMINI_KEY: localStorage.getItem('feisty_gemini_key') || '',
    WHATSAPP_URL: localStorage.getItem('feisty_whatsapp_url') || 'https://api.whacenter.com',
    WHATSAPP_DEVICE_ID: localStorage.getItem('feisty_whatsapp_device_id') || '',
    MIDTRANS_KEY: localStorage.getItem('feisty_midtrans_key') || '',
    STRIPE_KEY: localStorage.getItem('feisty_stripe_key') || '',
    IPAYMU_KEY: localStorage.getItem('feisty_ipaymu_key') || '',
    QRIS_API_KEY: localStorage.getItem('feisty_qris_api_key') || '',
    BASE_URL: localStorage.getItem('feisty_base_url') || window.location.origin,
    EMAIL_BACKEND: localStorage.getItem('feisty_email_backend') || 'noreply@feisty.id',
    MAINTENANCE_MODE: localStorage.getItem('feisty_maintenance_mode') === 'true',

    /**
     * Load configuration from server/GAS
     */
    async loadFromServer() {
        try {
            const response = await fetch(`${this.GAS_URL}?action=getConfig`);
            const config = await response.json();
            
            if (config && config.gas_url) {
                this.updateAll(config);
            }
        } catch (error) {
            console.warn('Could not load config from server, using defaults:', error);
        }
    },

    /**
     * Update all config and save to localStorage
     */
    updateAll(configObj) {
        if (configObj.gas_url) {
            this.GAS_URL = configObj.gas_url;
            localStorage.setItem('feisty_gas_url', configObj.gas_url);
        }
        if (configObj.spreadsheet_id) {
            this.SPREADSHEET_ID = configObj.spreadsheet_id;
            localStorage.setItem('feisty_spreadsheet_id', configObj.spreadsheet_id);
        }
        if (configObj.whatsapp_number) {
            this.WHATSAPP_NUMBER = configObj.whatsapp_number;
            localStorage.setItem('feisty_whatsapp_number', configObj.whatsapp_number);
        }
        if (configObj.gemini_key) {
            this.GEMINI_KEY = configObj.gemini_key;
            localStorage.setItem('feisty_gemini_key', configObj.gemini_key);
        }
        if (configObj.whatsapp_url) {
            this.WHATSAPP_URL = configObj.whatsapp_url;
            localStorage.setItem('feisty_whatsapp_url', configObj.whatsapp_url);
        }
        if (configObj.whatsapp_device_id) {
            this.WHATSAPP_DEVICE_ID = configObj.whatsapp_device_id;
            localStorage.setItem('feisty_whatsapp_device_id', configObj.whatsapp_device_id);
        }
        if (configObj.midtrans_key) {
            this.MIDTRANS_KEY = configObj.midtrans_key;
            localStorage.setItem('feisty_midtrans_key', configObj.midtrans_key);
        }
        if (configObj.stripe_key) {
            this.STRIPE_KEY = configObj.stripe_key;
            localStorage.setItem('feisty_stripe_key', configObj.stripe_key);
        }
        if (configObj.ipaymu_key) {
            this.IPAYMU_KEY = configObj.ipaymu_key;
            localStorage.setItem('feisty_ipaymu_key', configObj.ipaymu_key);
        }
        if (configObj.qris_api_key) {
            this.QRIS_API_KEY = configObj.qris_api_key;
            localStorage.setItem('feisty_qris_api_key', configObj.qris_api_key);
        }
        if (configObj.base_url) {
            this.BASE_URL = configObj.base_url;
            localStorage.setItem('feisty_base_url', configObj.base_url);
        }
        if (configObj.email_backend) {
            this.EMAIL_BACKEND = configObj.email_backend;
            localStorage.setItem('feisty_email_backend', configObj.email_backend);
        }
        if (configObj.hasOwnProperty('maintenance_mode')) {
            this.MAINTENANCE_MODE = configObj.maintenance_mode;
            localStorage.setItem('feisty_maintenance_mode', configObj.maintenance_mode);
        }
    },

    /**
     * Get all current config
     */
    getAll() {
        return {
            gas_url: this.GAS_URL,
            spreadsheet_id: this.SPREADSHEET_ID,
            whatsapp_number: this.WHATSAPP_NUMBER,
            gemini_key: this.GEMINI_KEY,
            whatsapp_url: this.WHATSAPP_URL,
            whatsapp_device_id: this.WHATSAPP_DEVICE_ID,
            midtrans_key: this.MIDTRANS_KEY,
            stripe_key: this.STRIPE_KEY,
            ipaymu_key: this.IPAYMU_KEY,
            qris_api_key: this.QRIS_API_KEY,
            base_url: this.BASE_URL,
            email_backend: this.EMAIL_BACKEND,
            maintenance_mode: this.MAINTENANCE_MODE
        };
    },

    /**
     * Check if maintenance mode is active
     */
    isUnderMaintenance() {
        return this.MAINTENANCE_MODE;
    },

    /**
     * Initialize - load config on page load
     */
    async init() {
        // Check maintenance mode first
        if (this.isUnderMaintenance() && !window.location.pathname.includes('admin.html')) {
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div style="text-align: center; color: white;">
                        <h1>🔧 Maintenance Mode</h1>
                        <p>Sistem sedang dalam pemeliharaan.</p>
                        <p>Silakan coba kembali segera!</p>
                    </div>
                </div>
            `;
            return false;
        }

        // Try to load config from server
        await this.loadFromServer();
        return true;
    }
};

// Auto initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FeistyConfig.init());
} else {
    FeistyConfig.init();
}
