// Chatbot Module - Short responses + Loading indicator
class ChatbotModule {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.maxPreviewLength = 250; // change this to adjust truncation length
        this.init();
    }

    init() {
        this.injectSpinnerStyles();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        document.getElementById('chatbot-open')?.addEventListener('click', () => this.openChatbot());
        document.getElementById('chatbot-toggle')?.addEventListener('click', () => this.toggleChatbot());
        document.getElementById('chatbot-send-btn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('chatbot-input-field')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        // Delegate click for read-more toggles
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('read-more-toggle')) {
                const container = e.target.closest('.message-content');
                if (!container) return;
                container.classList.toggle('expanded');
                e.target.textContent = container.classList.contains('expanded') ? 'Show less' : 'Read more';
            }
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = {
            type: 'bot',
            content: "Hi! I'm your E-Waste Assistant. Ask me anything about recycling, disposal, facilities, or eco-friendly practices!",
            timestamp: new Date()
        };
        this.messages.push(welcomeMessage);
        this.displayMessage(welcomeMessage);
    }

    openChatbot() {
        const container = document.getElementById('chatbot-container');
        const openBtn = document.getElementById('chatbot-open');
        if (!container || !openBtn) return;
        container.classList.add('active');
        openBtn.classList.add('hidden');
        this.isOpen = true;
        setTimeout(() => document.getElementById('chatbot-input-field')?.focus(), 200);
    }

    closeChatbot() {
        const container = document.getElementById('chatbot-container');
        const openBtn = document.getElementById('chatbot-open');
        if (!container || !openBtn) return;
        container.classList.remove('active');
        openBtn.classList.remove('hidden');
        this.isOpen = false;
    }

    toggleChatbot() {
        this.isOpen ? this.closeChatbot() : this.openChatbot();
    }

    // SHOW / HIDE GLOBAL LOADING OVERLAY
    showLoadingOverlay() {
        let overlay = document.getElementById('chatbot-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'chatbot-loading-overlay';
            overlay.innerHTML = `
                <div class="chatbot-loader">
                    <div class="spinner"></div>
                    <div class="loader-text">Thinking...</div>
                </div>`;
            document.getElementById('chatbot-container')?.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('chatbot-loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // SEND MESSAGE → BACKEND (Gemini)
    async sendMessage() {
        const input = document.getElementById('chatbot-input-field');
        const btn = document.getElementById('chatbot-send-btn');
        if (!input || !btn) return;

        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        btn.disabled = true;

        const userMsg = { type: 'user', content: text, timestamp: new Date() };
        this.messages.push(userMsg);
        this.displayMessage(userMsg);

        // show spinner overlay while awaiting response
        this.showLoadingOverlay();

        try {
            // call API
            const apiResponse = await window.api.sendChatbotQuery(text);

            // remove loader
            this.hideLoadingOverlay();

            // robust parsing and limit length
            const fullAnswer =
                apiResponse?.response?.answer ||
                apiResponse?.answer ||
                (typeof apiResponse === 'string' ? apiResponse : null) ||
                "Sorry, I couldn't generate an answer. Try again.";

            // Add bot message but show truncated preview if long
            const botMsg = { type: 'bot', content: String(fullAnswer), timestamp: new Date() };
            this.messages.push(botMsg);
            this.displayMessage(botMsg);

        } catch (err) {
            console.error('Chatbot send error:', err);
            this.hideLoadingOverlay();
            const botMsg = {
                type: 'bot',
                content: "Sorry, I'm having trouble responding right now. Please try again later.",
                timestamp: new Date()
            };
            this.messages.push(botMsg);
            this.displayMessage(botMsg);
        } finally {
            btn.disabled = false;
        }
    }

    // DISPLAY MESSAGE (handles truncation + read-more toggle)
    displayMessage(msg) {
        const box = document.getElementById('chatbot-messages');
        if (!box) return;

        const el = document.createElement('div');
        el.className = `message ${msg.type}-message`;

        // For bot messages, if long, render truncated preview with Read more toggle
        let contentHTML = this.escapeHtml(msg.content);
        if (msg.type === 'bot' && msg.content && msg.content.length > this.maxPreviewLength) {
            const preview = this.escapeHtml(msg.content.slice(0, this.maxPreviewLength));
            const rest = this.escapeHtml(msg.content.slice(this.maxPreviewLength));
            contentHTML = `
                <div class="preview-wrapper">
                    <div class="preview-text">${preview}<span class="ellipsis">…</span></div>
                    <div class="rest-text" style="display:none">${rest}</div>
                    <div class="message-content preview" >
                        <div class="preview-container">
                            <span class="preview-text-inline">${preview}</span>
                            <span class="ellipsis">…</span>
                            <span class="full-text" style="display:none">${preview}${rest}</span>
                        </div>
                        <button class="read-more-toggle">Read more</button>
                    </div>
                `;
            // Simpler approach below - we will use CSS + toggle to expand .message-content
            contentHTML = `<div class="message-content truncated">
                                <div class="short">${preview}<span class="dots">…</span></div>
                                <div class="full" style="display:none">${preview + rest}</div>
                                <button class="read-more-toggle">Read more</button>
                           </div>`;
        } else {
            contentHTML = `<div class="message-content">${contentHTML}</div>`;
        }

        // final structure includes time
        el.innerHTML = `
            ${contentHTML}
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
        `;

        box.appendChild(el);
        box.scrollTop = box.scrollHeight;

        // If we added truncated content, wire up the toggle (for robustness)
        const toggleBtn = el.querySelector('.read-more-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                const parent = e.target.closest('.message');
                if (!parent) return;
                const msgContent = parent.querySelector('.message-content');
                if (!msgContent) return;
                const isExpanded = msgContent.classList.toggle('expanded');
                if (isExpanded) {
                    // show full
                    msgContent.querySelector('.short')?.setAttribute('style', 'display:none');
                    msgContent.querySelector('.full')?.setAttribute('style', 'display:block');
                    e.target.textContent = 'Show less';
                } else {
                    // show short
                    msgContent.querySelector('.short')?.setAttribute('style', 'display:block');
                    msgContent.querySelector('.full')?.setAttribute('style', 'display:none');
                    e.target.textContent = 'Read more';
                }
                box.scrollTop = box.scrollHeight;
            });
        }
    }

    // Escape HTML to avoid XSS
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showTypingIndicator() {
        // keep for compatibility but we now show a global overlay; small inline indicator optional
        const box = document.getElementById('chatbot-messages');
        if (!box) return;
        const el = document.createElement('div');
        el.className = 'typing-indicator-inline';
        el.innerHTML = `<div class="message bot-message"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
        box.appendChild(el);
        box.scrollTop = box.scrollHeight;
    }

    removeTypingIndicator() {
        document.querySelectorAll('.typing-indicator-inline').forEach(e => e.remove());
    }

    formatTime(ts) {
        return ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // Inject spinner + minimal CSS used by overlay and truncation
    injectSpinnerStyles() {
        const css = `
#chatbot-loading-overlay {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  z-index: 999;
  border-radius: 8px;
}
.chatbot-loader { display:flex; flex-direction:column; align-items:center; gap:8px; }
.spinner {
  width:36px; height:36px; border:4px solid rgba(255,255,255,0.2); border-top-color:white; border-radius:50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.chatbot-loader .loader-text { color:white; font-size:0.9rem; opacity:0.95; font-weight:600; }

.message-content.truncated { max-width:100%; white-space:normal; }
.message-content.truncated .short { display:block; }
.message-content.truncated .full { display:none; }
.message-content.truncated.expanded .short { display:none; }
.message-content.truncated.expanded .full { display:block; }

.typing-dots { display:flex; gap:6px; padding:8px 0; }
.typing-dots span { width:8px; height:8px; background:rgba(0,0,0,0.2); border-radius:50%; animation: dot 1.2s infinite; }
.typing-dots span:nth-child(1){ animation-delay:0s } .typing-dots span:nth-child(2){ animation-delay:0.15s } .typing-dots span:nth-child(3){ animation-delay:0.3s }
@keyframes dot { 0%{ transform:translateY(0); opacity:0.4 } 50%{ transform:translateY(-6px); opacity:1 } 100%{ transform:translateY(0); opacity:0.4 } }
.read-more-toggle { margin-top:6px; background:transparent; border:none; color:var(--primary-color,#007bff); cursor:pointer; font-weight:600; }
`;
        const style = document.createElement('style');
        style.id = 'chatbot-loading-styles';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }
}

// expose
window.ChatbotModule = ChatbotModule;
if (typeof module !== 'undefined' && module.exports) module.exports = ChatbotModule;
