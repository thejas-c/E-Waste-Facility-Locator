// frontend/js/mass-collection.js (robust debug version)
console.log('mass-collection.js: loaded');

document.addEventListener("DOMContentLoaded", function () {
  console.log('mass-collection.js: DOMContentLoaded');
  const form = document.getElementById("mass-collection-form");
  if (!form) {
    console.error("mass-collection: form not found (#mass-collection-form)");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("📩 Submitting mass collection form...");

    const payload = {
      org_name: document.getElementById("org-name").value.trim(),
      org_type: document.getElementById("org-type").value,
      contact_person: document.getElementById("contact-person").value.trim(),
      contact_phone: document.getElementById("contact-phone").value.trim(),
      contact_email: document.getElementById("contact-email").value.trim(),
      address: document.getElementById("mc-address").value.trim(),
      pincode: document.getElementById("pincode").value.trim(),
      estimated_items: document.getElementById("estimated-items").value.trim(),
      scheduled_date: document.getElementById("mc-date").value || null,
      scheduled_time: document.getElementById("mc-time").value || null
    };

    // show immediate feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch("/api/mass-collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      console.log("mass-collection: POST /api/mass-collection status", res.status);
      const postBody = await safeParseJSON(res);
      console.log("mass-collection: POST response body:", postBody);

      if (!res.ok) {
        throw new Error("Server returned " + res.status + " on POST");
      }

      // success — reload list and await it
      alert("Mass collection request submitted successfully!");
      form.reset();

      // ensure small delay for DB commit propagation then reload list
      await sleep(250);
      await loadMassCollectionRequests(true); // force load and log
    } catch (err) {
      console.error("mass-collection: submit error:", err);
      alert("Failed to submit mass collection request. See console.");
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Mass Collection Request'; }
    }
  });
});

// small helper to sleep
function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

// safe JSON parse with fallback
async function safeParseJSON(responseOrText){
  try {
    if (!responseOrText) return null;
    // if a Response object was passed:
    if (responseOrText.json && typeof responseOrText.json === 'function') {
      return await responseOrText.json();
    }
    // otherwise assume text/string
    return JSON.parse(responseOrText);
  } catch (err) {
    // try to get text if it was a Response
    try {
      if (responseOrText && responseOrText.text) {
        const t = await responseOrText.text();
        try { return JSON.parse(t); } catch(e){ return t; }
      }
    } catch(e){}
    return null;
  }
}

// ===============================
// Load and Display User Requests (returns array)
// ===============================
async function loadMassCollectionRequests(logOnly = false) {
  const listContainer = document.getElementById("mass-collection-list");
  if (!listContainer) {
    console.warn('mass-collection: list container not found');
    return [];
  }

  if (logOnly) console.log('mass-collection: starting loadMassCollectionRequests');

  // show loading
  listContainer.innerHTML = '<div class="loading">Loading mass collection requests...</div>';

  try {
    const token = localStorage.getItem('token') || null;

    const res = await fetch("/api/mass-collection/my", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      cache: "no-store"
    });

    if (logOnly) console.log('mass-collection: /api/mass-collection/my response status', res.status);

    // parse body safely
    const body = await safeParseJSON(res);
    if (logOnly) console.log("mass-collection: GET response body:", body);

    if (res.status === 401 || res.status === 403) {
      listContainer.innerHTML = `<p class="error">You must be logged in to view requests.</p>`;
      return [];
    }

    if (!res.ok) {
      listContainer.innerHTML = `<p class="error">Failed to load requests (status ${res.status})</p>`;
      return [];
    }

    // Accept various shapes:
    // 1) { success: true, collections: [ ... ] }
    // 2) [ ... ] (array)
    // 3) { collections: [...] }
    // 4) { collection: {...} } single item
    let collections = [];

    if (Array.isArray(body)) {
      collections = body;
    } else if (body && Array.isArray(body.collections)) {
      collections = body.collections;
    } else if (body && Array.isArray(body.data)) {
      collections = body.data;
    } else if (body && body.collection && !Array.isArray(body.collection)) {
      collections = [body.collection];
    } else if (body && typeof body === 'object') {
      // try to find first array prop
      const arr = Object.values(body).find(v => Array.isArray(v));
      if (arr) collections = arr;
    }

    console.log('mass-collection: parsed collections length =', collections.length);

    if (!collections || collections.length === 0) {
      listContainer.innerHTML = `<p class="info">No mass collection requests found.</p>`;
      return collections;
    }

    // sort and render
    const sorted = collections.sort((a,b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));
    const html = sorted.map(req => {
      const statusBadge = `Status: <span class="status-${req.status}">${escapeHtml(req.status || 'pending')}</span>`;
      return `
        <div class="request-card">
          <h4>${escapeHtml(req.org_name || req.org || 'Unknown')}</h4>
          <p><strong>Type:</strong> ${escapeHtml(req.org_type || '-') } &nbsp; ${statusBadge}</p>
          <p><strong>Scheduled:</strong> ${escapeHtml(req.scheduled_date || '-') } ${escapeHtml(req.scheduled_time || '')}</p>
          <p><strong>Tracking:</strong> ${escapeHtml(req.tracking_note || 'No updates yet')}</p>
          <p class="muted"><strong>Updated:</strong> ${req.updated_at ? new Date(req.updated_at).toLocaleString() : (req.created_at ? new Date(req.created_at).toLocaleString() : '—')}</p>
        </div>
      `;
    }).join('');
    listContainer.innerHTML = html;
    return collections;
  } catch (err) {
    console.error('mass-collection: loadMassCollectionRequests error', err);
    listContainer.innerHTML = `<p class="error">Failed to load requests. Check console.</p>`;
    return [];
  }
}

// small helper to escape HTML
function escapeHtml(str='') {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// Expose for debugging if needed
window.loadMassCollectionRequests = loadMassCollectionRequests;
