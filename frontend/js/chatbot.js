// Chatbot Module - Gemini-ready, short replies, with loading spinner
class ChatbotModule {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.maxLength = 350; // max characters of bot reply
        this.init();
    }

    init() {
        this.injectStyles();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        const openBtn = document.getElementById('chatbot-open');
        const toggleBtn = document.getElementById('chatbot-toggle');
        const sendBtn = document.getElementById('chatbot-send-btn');
        const input = document.getElementById('chatbot-input-field');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openChatbot());
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleChatbot());
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    addWelcomeMessage() {
        const msg = {
            type: 'bot',
            content: "Hi! I'm your E-Waste Assistant. Ask me about recycling, safe disposal, facilities, or eco-friendly tips.",
            timestamp: new Date()
        };
        this.messages.push(msg);
        this.displayMessage(msg);
    }

    openChatbot() {
        const container = document.getElementById('chatbot-container');
        const openBtn = document.getElementById('chatbot-open');
        if (!container || !openBtn) return;

        container.classList.add('active');
        openBtn.classList.add('hidden');
        this.isOpen = true;

        setTimeout(() => {
            document.getElementById('chatbot-input-field')?.focus();
        }, 150);
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

    // Main send flow
    async sendMessage() {
        const input = document.getElementById('chatbot-input-field');
        const sendBtn = document.getElementById('chatbot-send-btn');
        if (!input || !sendBtn) return;

        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        sendBtn.disabled = true;

        const userMsg = {
            type: 'user',
            content: text,
            timestamp: new Date()
        };
        this.messages.push(userMsg);
        this.displayMessage(userMsg);

        this.showLoading();

        try {
            const apiResponse = await window.api.sendChatbotQuery(text);

            this.hideLoading();

            let answer =
                apiResponse?.response?.answer ||
                apiResponse?.answer ||
                (typeof apiResponse === 'string' ? apiResponse : '') ||
                "Sorry, I couldn't generate an answer. Please try again.";

            // shorten long responses
            if (answer.length > this.maxLength) {
                answer = answer.slice(0, this.maxLength) + '...';
            }

            const botMsg = {
                type: 'bot',
                content: answer,
                timestamp: new Date()
            };
            this.messages.push(botMsg);
            this.displayMessage(botMsg);
        } catch (err) {
            console.error('Chatbot error:', err);
            this.hideLoading();

            const botMsg = {
                type: 'bot',
                content: "Sorry, I'm having trouble responding right now. Please try again later.",
                timestamp: new Date()
            };
            this.messages.push(botMsg);
            this.displayMessage(botMsg);
        } finally {
            sendBtn.disabled = false;
        }
    }

    displayMessage(message) {
        const box = document.getElementById('chatbot-messages');
        if (!box) return;

        const el = document.createElement('div');
        el.className = `message ${message.type}-message`;

        el.innerHTML = `
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
        `;

        box.appendChild(el);
        box.scrollTop = box.scrollHeight;
    }

    // Loading overlay inside chatbot
    showLoading() {
        const container = document.getElementById('chatbot-container');
        if (!container) return;

        let overlay = document.getElementById('chatbot-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'chatbot-loading-overlay';
            overlay.innerHTML = `
                <div class="chatbot-loader">
                    <div class="spinner"></div>
                    <div class="loader-text">Thinking...</div>
                </div>
            `;
            container.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('chatbot-loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    formatTime(ts) {
        return ts.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    injectStyles() {
        const css = `
#chatbot-loading-overlay {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  z-index: 50;
  border-radius: 12px;
  pointer-events: none; /* don't block clicks on open button */
}
.chatbot-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.chatbot-loader .spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  animation: chatbot-spin 0.8s linear infinite;
}
.chatbot-loader .loader-text {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
}
@keyframes chatbot-spin {
  to { transform: rotate(360deg); }
}
        `;
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }
}

// Export
window.ChatbotModule = ChatbotModule;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotModule;
}
