// frontend/js/admin-mass-collection.js
// Admin Mass Collection Management Module (updated + socket support)

class AdminMassCollectionModule {
  constructor() {
    this.collections = [];
    this.currentCollectionId = null;
    this.io = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    // Try to connect to socket.io (optional)
    try {
      if (window.io) {
        this.io = window.io();
        this.io.on && this.io.on('mass_collection:update', (payload) => {
          console.log('mass-collection: socket update', payload);
          // If current list contains updated item -> refresh, or just reload list
          this.loadMassCollections();
          // optional: show a notification
          if (window.adminApp) window.adminApp.showNotification(`Mass collection ${payload.collection_id} updated: ${payload.status}`);
        });
      } else if (window.navigator) {
        // attempt to use socket.io client loaded on the page
        if (typeof io === 'function') {
          this.io = io();
          this.io.on('mass_collection:update', (payload) => {
            console.log('mass-collection: socket update', payload);
            this.loadMassCollections();
            if (window.adminApp) window.adminApp.showNotification(`Mass collection ${payload.collection_id} updated: ${payload.status}`);
          });
        }
      }
    } catch (e) {
      console.warn('mass-collection: socket init failed', e);
    }
  }

  setupEventListeners() {
    document.getElementById('collection-status-filter')?.addEventListener('change', () => this.loadMassCollections());
    document.getElementById('collection-org-type-filter')?.addEventListener('change', () => this.loadMassCollections());
    document.getElementById('collection-date-filter')?.addEventListener('change', () => this.loadMassCollections());
    document.getElementById('refresh-collections-btn')?.addEventListener('click', () => this.loadMassCollections());
    document.getElementById('update-collection-form')?.addEventListener('submit', (e) => this.handleUpdateCollection(e));
  }

  async loadMassCollections() {
    const container = document.getElementById('mass-collections-list');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading mass collections...</div>';

    try {
      const status = document.getElementById('collection-status-filter')?.value || 'all';
      const orgType = document.getElementById('collection-org-type-filter')?.value || 'all';
      const date = document.getElementById('collection-date-filter')?.value || '';

      const data = await this.getAllMassCollections(status, orgType, date);

      // normalize
      this.collections = data.collections || data.data || [];
      if (!Array.isArray(this.collections)) this.collections = [];

      this.displayMassCollections();
    } catch (err) {
      console.error('mass-collection: loadMassCollections error', err);
      if (window.adminApp) window.adminApp.showNotification('Failed to load mass collections', 'error');
      const container = document.getElementById('mass-collections-list');
      if (container) container.innerHTML = `<div class="loading">Failed to load mass collections</div>`;
    }
  }

  displayMassCollections() {
    const container = document.getElementById('mass-collections-list');
    if (!container) return;

    if (!this.collections || this.collections.length === 0) {
      container.innerHTML = '<div class="loading">No mass collection requests found</div>';
      return;
    }

    const html = this.collections.map(c => {
      const scheduled = c.scheduled_date ? `${this.formatDate(c.scheduled_date)} ${c.scheduled_time || ''}` : 'Not specified';
      const tracking = c.tracking_note ? this.escapeHtml(c.tracking_note) : 'No updates yet';
      const updatedAt = c.updated_at ? this.formatDateTime(c.updated_at) : (c.created_at ? this.formatDateTime(c.created_at) : '—');

      return `
        <div class="table-row mass-collection-row" data-id="${c.collection_id}">
          <div class="row-info">
            <h4>${this.escapeHtml(c.org_name)} <small class="muted">(${this.escapeHtml(c.org_type)})</small></h4>
            <p><strong>Contact:</strong> ${this.escapeHtml(c.contact_person || 'N/A')} &nbsp; <strong>Phone:</strong> ${this.escapeHtml(c.contact_phone || 'N/A')}</p>
            <p><strong>Email:</strong> ${this.escapeHtml(c.contact_email || 'N/A')}</p>
            <p><strong>Address:</strong> ${this.escapeHtml(c.address || '')}</p>
            <p><strong>Scheduled:</strong> ${this.escapeHtml(scheduled)}</p>
            <p><strong>Items:</strong> ${this.escapeHtml(c.estimated_items || 'Not specified')}</p>
            <p><strong>Requested:</strong> ${this.formatDateTime(c.created_at)}</p>
            <p><strong>Tracking:</strong> ${tracking}</p>
            <p><strong>Updated:</strong> ${updatedAt}</p>
            <span class="status-badge status-${c.status}">${this.formatStatus(c.status)}</span>
          </div>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="window.adminMassCollection.showUpdateCollectionModal(${c.collection_id}, '${c.status}', '${(c.tracking_note||'').replace(/'/g, "\\'").replace(/\n/g,' ')}')">
              <i class="fas fa-edit"></i> Update Status
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.adminMassCollection.showCollectionDetails(${c.collection_id})">
              <i class="fas fa-eye"></i> View
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  showUpdateCollectionModal(collectionId, currentStatus = 'pending', currentNote = '') {
    this.currentCollectionId = collectionId;
    document.getElementById('collection-status-select').value = currentStatus;
    document.getElementById('collection-tracking-note').value = currentNote || '';
    this.showModal('update-collection-modal');
  }

  async handleUpdateCollection(e) {
    e.preventDefault();
    const status = document.getElementById('collection-status-select').value;
    const trackingNote = document.getElementById('collection-tracking-note').value;
    const btn = e.target.querySelector('button[type="submit"]');

    if (!status) {
      if (window.adminApp) window.adminApp.showNotification('Please select a status', 'error');
      return;
    }

    try {
      btn.disabled = true; btn.textContent = 'Updating...';
      const result = await this.updateMassCollectionStatus(this.currentCollectionId, status, trackingNote);
      if (window.adminApp) window.adminApp.showNotification('Mass collection status updated');
      this.hideModal('update-collection-modal');
      await this.loadMassCollections();
      // if socket not active, optionally notify clients by calling another endpoint or relying on response
      console.log('mass-collection: update result', result);
    } catch (err) {
      console.error('mass-collection: update error', err);
      if (window.adminApp) window.adminApp.showNotification(err.message || 'Failed to update collection', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Update Status';
    }
  }

  showCollectionDetails(collectionId) {
    const c = this.collections.find(x => x.collection_id === collectionId);
    if (!c) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = `mass-collection-details-${collectionId}`;
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Mass Collection Details</h2>
        <div class="collection-details">
          <p><strong>Name:</strong> ${this.escapeHtml(c.org_name)}</p>
          <p><strong>Type:</strong> ${this.escapeHtml(c.org_type)}</p>
          <p><strong>Contact:</strong> ${this.escapeHtml(c.contact_person)} / ${this.escapeHtml(c.contact_phone)}</p>
          <p><strong>Email:</strong> ${this.escapeHtml(c.contact_email)}</p>
          <p><strong>Address:</strong> ${this.escapeHtml(c.address)}</p>
          <p><strong>Estimated Items:</strong> ${this.escapeHtml(c.estimated_items)}</p>
          <p><strong>Scheduled:</strong> ${this.formatDate(c.scheduled_date)} ${this.escapeHtml(c.scheduled_time || '')}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${c.status}">${this.formatStatus(c.status)}</span></p>
          <p><strong>Tracking Note:</strong> ${this.escapeHtml(c.tracking_note || 'No updates')}</p>
          <p><strong>Requested:</strong> ${this.formatDateTime(c.created_at)}</p>
          ${c.updated_at ? `<p><strong>Updated:</strong> ${this.formatDateTime(c.updated_at)}</p>` : ''}
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  formatStatus(s) {
    const map = { pending: 'Pending', scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
    return map[s] || (s ? s : 'Unknown');
  }

  formatDate(dateString) {
    if (!dateString) return 'Not specified';
    try {
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));
    } catch (e) { return dateString; }
  }

  formatDateTime(dateString) {
    if (!dateString) return '—';
    try {
      return new Intl.DateTimeFormat('en-GB', { year:'numeric',month:'short',day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(dateString));
    } catch (e) { return dateString; }
  }

  escapeHtml(s='') { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

  // API
  async getAllMassCollections(status = 'all', orgType = 'all', date = '') {
    const params = [];
    if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
    if (orgType && orgType !== 'all') params.push(`org_type=${encodeURIComponent(orgType)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/mass-collection/admin/all${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    return data;
  }

  async updateMassCollectionStatus(collectionId, status, tracking_note = '') {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/mass-collection/admin/${collectionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, tracking_note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update');
    return data;
  }

  showModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'block'; }
  hideModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }
}

// expose
window.adminMassCollection = new AdminMassCollectionModule();
