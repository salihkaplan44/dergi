// State Management
let selectedCoverFile = null;
let selectedPageFiles = [];

// Template State Management
let templatePages = [];
let editingMagazineId = null;
let currentEditingMagazineData = null;

// DOM Elements - Tabs
const tabClassicBtn = document.getElementById('tab-classic-btn');
const tabTemplateBtn = document.getElementById('tab-template-btn');
const activeTabInput = document.getElementById('active-tab');
const classicUploadPanel = document.getElementById('classic-upload-panel');
const templateBuilderPanel = document.getElementById('template-builder-panel');

// DOM Elements - Template Fields
const tplCoverSubtitle = document.getElementById('tpl-cover-subtitle');
const tplCoverColor = document.getElementById('tpl-cover-color');
const tplCoverTextcolor = document.getElementById('tpl-cover-textcolor');
const tplCoverBgInput = document.getElementById('tpl-cover-bg-input');
const addTemplatePageBtn = document.getElementById('add-template-page-btn');
const templatePagesList = document.getElementById('template-pages-list');
const templateEmptyState = document.getElementById('template-empty-state');

// DOM Elements - Sections
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const logoutBtn = document.getElementById('logout-btn');
const toastContainer = document.getElementById('toast-container');

// DOM Elements - Login
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');

// DOM Elements - Dashboard Stats
const statTotalMagazines = document.getElementById('stat-total-magazines');
const statTotalPages = document.getElementById('stat-total-pages');

// DOM Elements - Magazines List
const adminLoading = document.getElementById('admin-loading');
const adminEmpty = document.getElementById('admin-empty');
const magazinesTable = document.getElementById('magazines-table');
const magazinesTableBody = document.getElementById('magazines-table-body');

// DOM Elements - Modal & Form
const addModal = document.getElementById('publish-section');
const openAddModalBtn = document.getElementById('open-add-modal');
const closeAddModalBtn = document.getElementById('cancel-publish-btn');
const cancelAddBtn = document.getElementById('cancel-publish-btn');
const addMagazineForm = document.getElementById('add-magazine-form');
const magTitleInput = document.getElementById('mag-title');
const magDescInput = document.getElementById('mag-desc');
const magDateInput = document.getElementById('mag-date');
const submitMagazineTopBtn = document.getElementById('submit-magazine-top-btn');

// Cover Upload Elements
const coverDropzone = document.getElementById('cover-dropzone');
const coverInput = document.getElementById('cover-input');
const coverPreviewContainer = document.getElementById('cover-preview-container');
const coverPreview = document.getElementById('cover-preview');
const removeCoverBtn = document.getElementById('remove-cover-btn');

// Pages Upload Elements
const pagesDropzone = document.getElementById('pages-dropzone');
const pagesInput = document.getElementById('pages-input');
const pagesPreviewsArea = document.getElementById('pages-previews-area');
const pagesCountIndicator = document.getElementById('pages-count-indicator');
const clearPagesBtn = document.getElementById('clear-pages-btn');
const pagesPreviewsGrid = document.getElementById('pages-previews-grid');

// Upload Overlay
const uploadOverlay = document.getElementById('upload-overlay');
const uploadStatusTitle = document.getElementById('upload-status-title');
const uploadStatusSub = document.getElementById('upload-status-sub');
// Custom Delete Confirmation Modal Elements
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteConfirmText = document.getElementById('delete-confirm-text');
const deleteConfirmCancelBtn = document.getElementById('delete-confirm-cancel-btn');
const deleteConfirmOkBtn = document.getElementById('delete-confirm-ok-btn');
let pendingDeleteId = null;

// Delete confirmation modal actions
if (deleteConfirmCancelBtn && deleteConfirmOkBtn) {
  deleteConfirmCancelBtn.addEventListener('click', () => {
    deleteConfirmModal.style.display = 'none';
    pendingDeleteId = null;
  });

  deleteConfirmOkBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    deleteConfirmModal.style.display = 'none';
    pendingDeleteId = null;

    try {
      const res = await fetch(`/api/magazines/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Sayı başarıyla silindi.');
        fetchDashboardData();
      } else {
        throw new Error(data.error || 'Silme işlemi başarısız.');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Change Password Modal Elements
const openChangePasswordBtn = document.getElementById('open-change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');
const changePasswordCancelBtn = document.getElementById('change-password-cancel-btn');

if (openChangePasswordBtn) {
  openChangePasswordBtn.addEventListener('click', () => {
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmNewPasswordInput.value = '';
    changePasswordModal.style.display = 'flex';
    initIcons();
  });
}

if (changePasswordCancelBtn) {
  changePasswordCancelBtn.addEventListener('click', () => {
    changePasswordModal.style.display = 'none';
  });
}

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;
    
    if (newPassword !== confirmNewPassword) {
      showToast('Yeni şifreler eşleşmiyor.', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        showToast('Şifreniz başarıyla güncellendi.');
        changePasswordModal.style.display = 'none';
      } else {
        throw new Error(data.error || 'Şifre güncellenemedi.');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Initialize Lucide Icons
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Show Toast Alert
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}"></i>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  initIcons();

  // Trigger animation
  setTimeout(() => toast.classList.add('active'), 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Check Auth Status on Load
async function checkAuth() {
  try {
    const res = await fetch('/api/auth-status');
    const data = await res.json();
    if (data.isAdmin) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    showLogin();
  }
}

// Show Login Card
function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
  logoutBtn.style.display = 'none';
  initIcons();
}

// Show Dashboard
function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  logoutBtn.style.display = 'flex';
  initIcons();
  fetchDashboardData();
}

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = passwordInput.value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Giriş başarılı. Yönetim paneli yüklendi.');
      passwordInput.value = '';
      showDashboard();
    } else {
      throw new Error(data.error || 'Şifre hatalı.');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Logout Request
logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Oturum kapatıldı.');
      showLogin();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast('Çıkış yapılırken hata oluştu.', 'error');
  }
});

// Fetch magazines for dashboard
async function fetchDashboardData() {
  try {
    adminLoading.style.display = 'flex';
    magazinesTable.style.display = 'none';
    adminEmpty.style.display = 'none';

    const res = await fetch('/api/magazines');
    if (!res.ok) throw new Error('Sayılar alınamadı.');

    const magazines = await res.json();
    adminLoading.style.display = 'none';

    // Update Stats
    statTotalMagazines.textContent = magazines.length;
    let totalPages = 0;
    magazines.forEach(m => {
      totalPages += (m.pages ? m.pages.length : 0) + 1; // cover + pages
    });
    statTotalPages.textContent = totalPages;

    if (magazines.length === 0) {
      adminEmpty.style.display = 'block';
    } else {
      renderMagazinesTable(magazines);
    }
  } catch (error) {
    adminLoading.style.display = 'none';
    adminEmpty.style.display = 'block';
    showToast(error.message, 'error');
  }
}

// Render Magazines Table
function renderMagazinesTable(magazines) {
  magazinesTableBody.innerHTML = '';
  
  magazines.forEach(mag => {
    const publishDateFormatted = new Date(mag.publishDate).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const pageCount = (mag.pages ? mag.pages.length : 0) + 1; // plus cover

    let thumbHtml = '';
    if (mag.isTemplate && !mag.coverUrl) {
      const color = mag.cover ? mag.cover.color : 'violet';
      let gradientStyle = 'linear-gradient(135deg, #2e1065 0%, #0f052d 100%)';
      if (color === 'emerald') gradientStyle = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)';
      else if (color === 'crimson') gradientStyle = 'linear-gradient(135deg, #881337 0%, #4c0519 100%)';
      else if (color === 'amber') gradientStyle = 'linear-gradient(135deg, #78350f 0%, #451a03 100%)';
      else if (color === 'dark') gradientStyle = 'linear-gradient(135deg, #18181b 0%, #09090b 100%)';
      
      thumbHtml = `<div class="admin-mag-thumb" style="background: ${gradientStyle}; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.5rem; font-weight: bold; text-align: center; border-radius: 6px; flex-shrink: 0;">ŞABLON</div>`;
    } else {
      thumbHtml = `<img class="admin-mag-thumb" src="${mag.coverUrl}" alt="Kapak">`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="admin-mag-info">
          ${thumbHtml}
          <div>
            <div style="font-weight: 600;">${escapeHtml(mag.title)}</div>
            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(mag.description) || 'Açıklama yok'}
            </div>
          </div>
        </div>
      </td>
      <td>${publishDateFormatted}</td>
      <td>${pageCount} Sayfa</td>

      <td>
        <div style="display: flex; gap: 8px;">
          <a href="/" target="_blank" class="btn btn-secondary btn-sm" style="padding: 6px 10px;">Görüntüle</a>
          <button class="btn btn-primary btn-sm edit-btn" data-id="${mag.id}" style="padding: 6px 10px;">Düzenle</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${mag.id}" data-title="${mag.title}">Sil</button>
        </div>
      </td>
    `;
    magazinesTableBody.appendChild(tr);
  });

  // Attach event listeners to Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const magId = btn.getAttribute('data-id');
      editMagazine(magId);
    });
  });

  // Attach event listeners to Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const magId = btn.getAttribute('data-id');
      const magTitle = btn.getAttribute('data-title');
      deleteMagazine(magId, magTitle);
    });
  });

  magazinesTable.style.display = 'table';
  initIcons();
}

// Open Custom Delete Confirmation Modal
function deleteMagazine(id, title) {
  pendingDeleteId = id;
  deleteConfirmText.textContent = `"${title}" sayısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`;
  deleteConfirmModal.style.display = 'flex';
  initIcons();
}

async function editMagazine(id) {
  try {
    const res = await fetch(`/api/magazines`);
    if (!res.ok) throw new Error('Sayılar alınamadı.');
    const magazines = await res.json();
    const mag = magazines.find(m => m.id === id);
    if (!mag) throw new Error('Sayı bulunamadı.');

    editingMagazineId = id; // Set global editing state!
    
    // Populate metadata fields
    magTitleInput.value = mag.title || '';
    magDescInput.value = mag.description || '';
    magDateInput.value = mag.publishDate ? mag.publishDate.split('T')[0] : '';
    
    // Change workspace header title
    const workspaceTitle = document.querySelector('#publish-section h3');
    if (workspaceTitle) workspaceTitle.textContent = 'Sayı Düzenleme Bölümü';
    if (submitMagazineTopBtn) {
      const btnSpan = submitMagazineTopBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Değişiklikleri Kaydet';
    }

    // Clear/Reset standard form preview variables
    coverPreviewContainer.style.display = 'none';
    coverPreview.src = '';
    pagesPreviewsGrid.innerHTML = '';
    pagesCountIndicator.textContent = 'Henüz sayfa eklenmedi';

    if (mag.isTemplate) {
      // Switch tab visually
      if (tabTemplateBtn) tabTemplateBtn.click();
      
      // Load template structure
      loadTemplateForEditing(mag);
    } else {
      // Switch tab visually
      if (tabClassicBtn) tabClassicBtn.click();
      
      // Show existing cover
      if (mag.coverUrl) {
        coverPreview.src = mag.coverUrl;
        coverPreviewContainer.style.display = 'block';
        coverDropzone.style.display = 'none';
      }

      // Show existing page previews in classic mode
      if (mag.pages && Array.isArray(mag.pages)) {
        pagesCountIndicator.textContent = `${mag.pages.length} sayfa yüklü`;
        pagesPreviewsArea.style.display = 'block';
        pagesDropzone.style.display = 'block'; // Allow adding more
        
        mag.pages.forEach((pageUrl, idx) => {
          const previewDiv = document.createElement('div');
          previewDiv.className = 'page-preview-item';
          previewDiv.innerHTML = `
            <img class="page-preview-img" src="${pageUrl}" alt="Sayfa ${idx + 1}">
            <span class="page-preview-num">${idx + 1}</span>
            <div style="font-size:0.65rem; color:var(--text-secondary); text-align:center; margin-top:2px;">Yüklü Dosya</div>
          `;
          pagesPreviewsGrid.appendChild(previewDiv);
        });
      }
    }

    // Show the workspace and hide dashboard
    dashboardSection.style.display = 'none';
    addModal.style.display = 'block';
    
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function loadTemplateForEditing(mag) {
  currentEditingMagazineData = mag;
  
  // Set cover templates settings inputs
  tplCoverSubtitle.value = (mag.cover && mag.cover.subtitle) || '';
  tplCoverColor.value = (mag.cover && mag.cover.color) || 'violet';
  tplCoverTextcolor.value = (mag.cover && mag.cover.textcolor) || '#ffffff';
  
  // Reset cover file inputs
  tplCoverBgInput.value = '';
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`tpl-cover-sub${i}-input`);
    if (input) input.value = '';
  }

  // Load pages into templatePages array
  templatePages = [];
  if (mag.pages && Array.isArray(mag.pages)) {
    mag.pages.forEach(p => {
      templatePages.push({
        id: p.id || ('page_' + Date.now() + '_' + Math.floor(Math.random() * 10000)),
        layout: p.layout || 'text-only',
        title: p.title || '',
        subtitle: p.subtitle || '',
        text: p.text || '',
        imageUrl: p.imageUrl || '',
        imageFile: null
      });
    });
  }

  activeEditorPageIndex = 'cover';
  renderWorkspaceCanvas();
  renderEditorPageList();
}

// Escape HTML Helper
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- WORKSPACE TRANSITION AND UPLOAD LOGIC ---

// Open Publisher Workspace
openAddModalBtn.addEventListener('click', () => {
  addModal.style.display = 'block';
  dashboardSection.style.display = 'none';
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  magDateInput.value = today;
  resetForm();
});

// Close Publisher Workspace
function closeModal() {
  addModal.style.display = 'none';
  dashboardSection.style.display = 'block';
  resetForm();
}
closeAddModalBtn.addEventListener('click', closeModal);
if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeModal);

// Top Submit button link
if (submitMagazineTopBtn) {
  submitMagazineTopBtn.addEventListener('click', () => {
    addMagazineForm.requestSubmit();
  });
}

// Reset upload form state
function resetForm() {
  addMagazineForm.reset();
  
  editingMagazineId = null;
  currentEditingMagazineData = null;
  const workspaceTitle = document.querySelector('#publish-section h3');
  if (workspaceTitle) workspaceTitle.textContent = 'Yeni Sayı Yayınlama Bölümü';
  if (submitMagazineTopBtn) {
    const btnSpan = submitMagazineTopBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Sayıyı Yayınla';
  }

  // Reset cover preview
  selectedCoverFile = null;
  coverPreview.src = '';
  coverPreviewContainer.style.display = 'none';
  coverDropzone.style.display = 'block';
  
  // Reset pages previews
  selectedPageFiles = [];
  pagesPreviewsGrid.innerHTML = '';
  pagesPreviewsArea.style.display = 'none';
  pagesDropzone.style.display = 'block';

  // Reset template builder visual editor state
  templatePages = [];
  activeEditorPageIndex = 'cover';
  if (tplCoverSubtitle) tplCoverSubtitle.value = '';
  if (tplCoverColor) tplCoverColor.value = 'violet';
  if (tplCoverTextcolor) tplCoverTextcolor.value = '#ffffff';
  if (tplCoverBgInput) tplCoverBgInput.value = '';
  for (let i = 1; i <= 5; i++) {
    const subInput = document.getElementById(`tpl-cover-sub${i}-input`);
    if (subInput) subInput.value = '';
  }
  
  renderEditorPageList();
  renderWorkspaceCanvas();
  
  // Click classic tab to reset active panel
  if (tabClassicBtn) {
    tabClassicBtn.classList.add('active');
    if (tabTemplateBtn) tabTemplateBtn.classList.remove('active');
    if (activeTabInput) activeTabInput.value = 'classic';
    if (classicUploadPanel) classicUploadPanel.style.display = 'block';
    if (templateBuilderPanel) templateBuilderPanel.style.display = 'none';
  }
}

// Cover Dropzone Events
coverDropzone.addEventListener('click', () => coverInput.click());
coverDropzone.addEventListener('dragover', (e) => { e.preventDefault(); coverDropzone.classList.add('dragover'); });
coverDropzone.addEventListener('dragleave', () => coverDropzone.classList.remove('dragover'));
coverDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  coverDropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleCoverFile(e.dataTransfer.files[0]);
  }
});
coverInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleCoverFile(e.target.files[0]);
  }
});

function handleCoverFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Kapak dosyası sadece resim olmalıdır.', 'error');
    return;
  }
  selectedCoverFile = file;
  
  // Render Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    coverPreview.src = e.target.result;
    coverDropzone.style.display = 'none';
    coverPreviewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

removeCoverBtn.addEventListener('click', () => {
  selectedCoverFile = null;
  coverPreview.src = '';
  coverPreviewContainer.style.display = 'none';
  coverDropzone.style.display = 'block';
  coverInput.value = '';
});

// Pages Dropzone Events
pagesDropzone.addEventListener('click', () => pagesInput.click());
pagesDropzone.addEventListener('dragover', (e) => { e.preventDefault(); pagesDropzone.classList.add('dragover'); });
pagesDropzone.addEventListener('dragleave', () => pagesDropzone.classList.remove('dragover'));
pagesDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  pagesDropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handlePagesFiles(e.dataTransfer.files);
  }
});
pagesInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handlePagesFiles(e.target.files);
  }
});

function handlePagesFiles(files) {
  const newFiles = Array.from(files).filter(file => {
    if (!file.type.startsWith('image/')) {
      showToast(`"${file.name}" dosyası resim olmadığı için atlandı.`, 'warning');
      return false;
    }
    return true;
  });

  if (newFiles.length === 0) return;

  selectedPageFiles = [...selectedPageFiles, ...newFiles];

  // Alphabetically sort files by their original filename to preserve reading order
  selectedPageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  renderPagePreviews();
}

function renderPagePreviews() {
  pagesPreviewsGrid.innerHTML = '';

  if (selectedPageFiles.length === 0) {
    pagesPreviewsArea.style.display = 'none';
    pagesDropzone.style.display = 'block';
    return;
  }

  pagesCountIndicator.textContent = `${selectedPageFiles.length} Sayfa Seçildi`;
  pagesPreviewsArea.style.display = 'block';

  selectedPageFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'page-preview-item';
    
    // Read and preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      item.innerHTML = `
        <img class="page-preview-img" src="${e.target.result}" alt="Önizleme">
        <span class="page-preview-num">${index + 1}</span>
        <button type="button" class="page-preview-remove" data-index="${index}">&times;</button>
      `;

      // Attach delete event
      item.querySelector('.page-preview-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removePage(index);
      });
    };
    reader.readAsDataURL(file);

    pagesPreviewsGrid.appendChild(item);
  });
}

function removePage(index) {
  selectedPageFiles.splice(index, 1);
  renderPagePreviews();
}

clearPagesBtn.addEventListener('click', () => {
  selectedPageFiles = [];
  renderPagePreviews();
  pagesInput.value = '';
});

// --- TEMPLATE BUILDER VISUAL WYSIWYG EDITOR LOGIC ---

let activeEditorPageIndex = 'cover';
let draggedIndex = null;

// Select visual editor DOM elements
const editorPageList = document.getElementById('editor-page-list');
const addEditorPageBtn = document.getElementById('add-editor-page-btn');
const activePageTitleLabel = document.getElementById('active-page-title-label');
const activePageLayoutSelect = document.getElementById('active-page-layout-select');
const activePageActions = document.getElementById('active-page-actions');
const activePageCanvasWrapper = document.getElementById('active-page-canvas-wrapper');

// Tab Switching
tabClassicBtn.addEventListener('click', () => {
  tabClassicBtn.classList.add('active');
  tabTemplateBtn.classList.remove('active');
  activeTabInput.value = 'classic';
  classicUploadPanel.style.display = 'block';
  templateBuilderPanel.style.display = 'none';
});

tabTemplateBtn.addEventListener('click', () => {
  tabTemplateBtn.classList.add('active');
  tabClassicBtn.classList.remove('active');
  activeTabInput.value = 'template';
  templateBuilderPanel.style.display = 'block';
  classicUploadPanel.style.display = 'none';
  
  // Set default active view
  activeEditorPageIndex = 'cover';
  renderEditorPageList();
  renderWorkspaceCanvas();
});

// Setup paste event handling for pasting clipboard images directly into the active editor page
document.addEventListener('paste', (e) => {
  if (activeTabInput.value !== 'template') return;
  
  if (e.clipboardData && e.clipboardData.files.length > 0) {
    const file = e.clipboardData.files[0];
    if (file.type.startsWith('image/')) {
      e.preventDefault();
      if (activeEditorPageIndex === 'cover') {
        // Set as cover background image
        const dt = new DataTransfer();
        dt.items.add(file);
        tplCoverBgInput.files = dt.files;
        tplCoverBgInput.dispatchEvent(new Event('change'));
        showToast('Kapak arka plan resmi panodan yapıştırıldı.');
      } else {
        const page = templatePages[activeEditorPageIndex];
        if (page) {
          page.imageFile = file;
          renderWorkspaceCanvas();
          renderEditorPageList();
          showToast(`Sayfa ${activeEditorPageIndex + 1} resmi panodan yapıştırıldı.`);
        }
      }
    }
  }
});

// Watch cover settings hidden input changes to redraw canvas
tplCoverBgInput.addEventListener('change', () => {
  renderWorkspaceCanvas();
});

// Add new page button listener
addEditorPageBtn.addEventListener('click', () => {
  const newPage = {
    id: 'page_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    layout: 'text-only',
    title: '',
    subtitle: '',
    text: '',
    imageFile: null
  };
  templatePages.push(newPage);
  activeEditorPageIndex = templatePages.length - 1;
  renderWorkspaceCanvas();
  renderEditorPageList();
});

// Remove page helper
function removeTemplatePage(pageId) {
  templatePages = templatePages.filter(p => p.id !== pageId);
}

// Watch layout selection changes in toolbar
activePageLayoutSelect.addEventListener('change', (e) => {
  if (activeEditorPageIndex !== 'cover') {
    const page = templatePages[activeEditorPageIndex];
    if (page) {
      page.layout = e.target.value;
      renderWorkspaceCanvas();
      renderEditorPageList();
    }
  }
});

// Sidebar renderer
function renderEditorPageList() {
  editorPageList.innerHTML = '';
  
  // 1. Render Cover Page Thumbnail
  const coverItem = document.createElement('div');
  coverItem.className = `sidebar-page-item glass ${activeEditorPageIndex === 'cover' ? 'active' : ''}`;
  
  // Dynamic gradient based on color select value
  const coverColor = tplCoverColor.value || 'violet';
  let coverGrad = 'linear-gradient(135deg, #2e1065 0%, #0f052d 100%)';
  if (coverColor === 'emerald') coverGrad = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)';
  else if (coverColor === 'crimson') coverGrad = 'linear-gradient(135deg, #881337 0%, #4c0519 100%)';
  else if (coverColor === 'amber') coverGrad = 'linear-gradient(135deg, #78350f 0%, #451a03 100%)';
  else if (coverColor === 'dark') coverGrad = 'linear-gradient(135deg, #18181b 0%, #09090b 100%)';

  coverItem.style.cssText = `
    padding: 10px; 
    border: 1px solid ${activeEditorPageIndex === 'cover' ? 'var(--accent-primary)' : 'var(--border-glass)'}; 
    border-radius: 8px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    cursor: pointer; 
    background: ${activeEditorPageIndex === 'cover' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)'};
    transition: var(--transition);
  `;
  
  coverItem.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex-grow: 1;">
      <div style="width: 30px; height: 40px; border-radius: 4px; background: ${coverGrad}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.45rem; font-weight: bold; text-transform: uppercase;">KPK</div>
      <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; font-weight: 600;">Kapak Sayfası</div>
    </div>
  `;
  coverItem.addEventListener('click', () => {
    activeEditorPageIndex = 'cover';
    renderWorkspaceCanvas();
    renderEditorPageList();
  });
  editorPageList.appendChild(coverItem);
  
  // 2. Render Inner Pages
  templatePages.forEach((page, idx) => {
    const item = document.createElement('div');
    item.className = `sidebar-page-item glass ${activeEditorPageIndex === idx ? 'active' : ''}`;
    item.setAttribute('draggable', 'true');
    item.style.cssText = `
      padding: 10px; 
      border: 1px solid ${activeEditorPageIndex === idx ? 'var(--accent-primary)' : 'var(--border-glass)'}; 
      border-radius: 8px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      cursor: grab; 
      background: ${activeEditorPageIndex === idx ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)'};
      transition: var(--transition);
    `;
    
    // Icon based on layout
    let layoutIcon = 'align-left';
    if (page.layout === 'image-text' || page.layout === 'text-image' || page.layout === 'image-over-text') {
      layoutIcon = 'image';
    } else if (page.layout === 'full-image') {
      layoutIcon = 'maximize';
    }
    
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex-grow: 1;">
        <div style="width: 30px; height: 40px; border-radius: 4px; background: #2a2b36; color: #a1a1a6; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.5rem; font-weight: bold; border: 1px solid var(--border-glass);">
          <i data-lucide="${layoutIcon}" style="width: 12px; height: 12px; opacity: 0.6;"></i>
        </div>
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; font-weight: 600;">
          Sayfa ${idx + 1} <span style="font-size: 0.65rem; opacity: 0.6; display: block; font-weight: normal; overflow: hidden; text-overflow: ellipsis;">${page.title || 'Başlıksız'}</span>
        </div>
      </div>
      <button type="button" class="tpl-remove-page-btn" style="background: none; border: none; color: var(--danger); font-size: 0.85rem; cursor: pointer; padding: 4px;">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;
    
    item.addEventListener('click', (e) => {
      // Check if delete button was clicked
      if (e.target.closest('.tpl-remove-page-btn')) {
        e.stopPropagation();
        removeTemplatePage(page.id);
        if (activeEditorPageIndex === idx) {
          activeEditorPageIndex = 'cover';
        } else if (activeEditorPageIndex > idx) {
          activeEditorPageIndex--;
        }
        renderWorkspaceCanvas();
        renderEditorPageList();
        return;
      }
      activeEditorPageIndex = idx;
      renderWorkspaceCanvas();
      renderEditorPageList();
    });
    
    // HTML5 Drag and drop
    item.addEventListener('dragstart', (e) => {
      draggedIndex = idx;
      e.dataTransfer.effectAllowed = 'move';
      item.style.opacity = '0.5';
    });
    
    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
      draggedIndex = null;
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.style.border = '2px dashed var(--accent-primary)';
    });
    
    item.addEventListener('dragleave', () => {
      item.style.border = activeEditorPageIndex === idx ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)';
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== idx) {
        // Move item in templatePages
        const movedPage = templatePages.splice(draggedIndex, 1)[0];
        templatePages.splice(idx, 0, movedPage);
        // Set new active index
        activeEditorPageIndex = idx;
        renderWorkspaceCanvas();
        renderEditorPageList();
      }
    });
    
    editorPageList.appendChild(item);
  });
  
  // Update sidebar count
  document.getElementById('sidebar-page-count').textContent = `${templatePages.length + 1} Sayfa`;
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Workspace canvas renderer
function renderWorkspaceCanvas() {
  activePageCanvasWrapper.innerHTML = '';
  activePageActions.innerHTML = '';
  
  if (activeEditorPageIndex === 'cover') {
    activePageTitleLabel.textContent = 'Kapak Tasarımı';
    activePageLayoutSelect.style.display = 'none';
    
    // Render cover toolbar actions
    activePageActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight:600;">Tema:</label>
        <select id="action-cover-color" style="padding: 4px 8px; border-radius: 6px; background: var(--bg-secondary); border:1px solid var(--border-glass); color:white; font-size:0.75rem;">
          <option value="violet" ${tplCoverColor.value === 'violet' ? 'selected' : ''}>Asil Mor</option>
          <option value="emerald" ${tplCoverColor.value === 'emerald' ? 'selected' : ''}>Zümrüt Yeşili</option>
          <option value="crimson" ${tplCoverColor.value === 'crimson' ? 'selected' : ''}>Yakut Kırmızısı</option>
          <option value="amber" ${tplCoverColor.value === 'amber' ? 'selected' : ''}>Altın Sarısı</option>
          <option value="dark" ${tplCoverColor.value === 'dark' ? 'selected' : ''}>Derin Gece</option>
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; margin-left: 8px;">
        <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight:600;">Yazı:</label>
        <select id="action-cover-textcolor" style="padding: 4px 8px; border-radius: 6px; background: var(--bg-secondary); border:1px solid var(--border-glass); color:white; font-size:0.75rem;">
          <option value="#ffffff" ${tplCoverTextcolor.value === '#ffffff' ? 'selected' : ''}>Beyaz</option>
          <option value="#f3f4f6" ${tplCoverTextcolor.value === '#f3f4f6' ? 'selected' : ''}>Açık Gri</option>
          <option value="#fef08a" ${tplCoverTextcolor.value === '#fef08a' ? 'selected' : ''}>Açık Sarı</option>
        </select>
      </div>
    `;
    
    // Bind toolbar events to hidden form elements
    const actColor = document.getElementById('action-cover-color');
    actColor.addEventListener('change', (e) => {
      tplCoverColor.value = e.target.value;
      renderWorkspaceCanvas();
      renderEditorPageList();
    });
    
    const actText = document.getElementById('action-cover-textcolor');
    actText.addEventListener('change', (e) => {
      tplCoverTextcolor.value = e.target.value;
      renderWorkspaceCanvas();
    });
    
    // Draw canvas page
    const color = tplCoverColor.value || 'violet';
    const textcolor = tplCoverTextcolor.value || '#ffffff';
    
    let bgUrl = '';
    if (tplCoverBgInput.files && tplCoverBgInput.files[0]) {
      bgUrl = URL.createObjectURL(tplCoverBgInput.files[0]);
    } else if (editingMagazineId && currentEditingMagazineData && currentEditingMagazineData.cover && currentEditingMagazineData.cover.bgUrl) {
      bgUrl = currentEditingMagazineData.cover.bgUrl;
    }
    
    let bgImgHtml = '';
    if (bgUrl) {
      bgImgHtml = `<img class="tpl-cover-bg-image" src="${bgUrl}" alt="Arka Plan" style="opacity: 1; pointer-events: none;">`;
    }

    const subUrls = [];
    for (let i = 1; i <= 5; i++) {
      const subInput = document.getElementById(`tpl-cover-sub${i}-input`);
      if (subInput && subInput.files && subInput.files[0]) {
        subUrls.push(URL.createObjectURL(subInput.files[0]));
      } else if (editingMagazineId && currentEditingMagazineData && currentEditingMagazineData.cover && currentEditingMagazineData.cover.subImages && currentEditingMagazineData.cover.subImages[i - 1]) {
        subUrls.push(currentEditingMagazineData.cover.subImages[i - 1]);
      } else {
        subUrls.push(`/images/sub${i}.png`);
      }
    }
    
    const canvasPage = document.createElement('div');
    canvasPage.className = `template-page active-canvas-page cover-template-custom cover-template-${color}`;
    canvasPage.style.color = textcolor;
    canvasPage.innerHTML = `
      <div class="tpl-cover-top-section" style="border-bottom: 2px solid ${textcolor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}; pointer-events: auto;">
        <div class="tpl-cover-header-left">
          <h1 class="tpl-cover-main-title">HAKKIN İZİNDE</h1>
          <div class="tpl-cover-school-name" contenteditable="true" data-placeholder="Okul veya Dernek Adı" style="outline: none;">${tplCoverSubtitle.value || 'HACI AVNİ KIZ İMAM HATİP LİSESİ'}</div>
        </div>
        <div class="tpl-cover-header-right">
          <div class="tpl-cover-calligraphy">
            <span class="arabic">ایمان</span>
            <span class="translation">"Rabbim! İlmimi artır."</span>
            <span class="ref">Tâ-Hâ Sûresi, 114</span>
          </div>
        </div>
      </div>

      <div class="tpl-cover-middle-section" style="position: relative; flex-grow: 1; min-height: 150px; pointer-events: auto; cursor: pointer;">
        ${bgImgHtml || `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:rgba(255,255,255,0.4); background: rgba(0,0,0,0.25); font-size:0.65rem;"><i data-lucide="image" style="width:18px; height:18px; margin-bottom:4px;"></i>Kapak Resmi Seçin (Tıklayın veya Sürükleyin)</div>`}
        <div class="tpl-cover-issue-badge">
          <span class="issue-title" contenteditable="true" data-placeholder="Sayı Adı (Ana Başlık)" style="outline: none;">${magTitleInput.value || 'Sayı Başlığı'}</span>
          <span class="issue-date">Kapak Resmi</span>
        </div>
        <div class="canvas-image-upload-overlay" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.6rem; cursor: pointer; display: flex; align-items: center; gap: 4px; z-index: 10;">
          <i data-lucide="image" style="width: 12px; height: 12px;"></i> Kapak Değiştir
        </div>
      </div>

      <div class="tpl-cover-collage-section" style="pointer-events: auto;">
        <div class="collage-clip-path-wrapper">
          <div class="collage-item clip-panel-1" data-sub="1" style="cursor: pointer;" title="Resim Yüklemek İçin Tıklayın veya Sürükleyin">
            <img src="${subUrls[0]}" alt="Sub 1">
          </div>
          <div class="collage-item clip-panel-2" data-sub="2" style="cursor: pointer;" title="Resim Yüklemek İçin Tıklayın veya Sürükleyin">
            <img src="${subUrls[1]}" alt="Sub 2">
          </div>
          <div class="collage-item clip-panel-3" data-sub="3" style="cursor: pointer;" title="Resim Yüklemek İçin Tıklayın veya Sürükleyin">
            <img src="${subUrls[2]}" alt="Sub 3">
          </div>
          <div class="collage-item clip-panel-4" data-sub="4" style="cursor: pointer;" title="Resim Yüklemek İçin Tıklayın veya Sürükleyin">
            <img src="${subUrls[3]}" alt="Sub 4">
          </div>
          <div class="collage-item clip-panel-5" data-sub="5" style="cursor: pointer;" title="Resim Yüklemek İçin Tıklayın veya Sürükleyin">
            <img src="${subUrls[4]}" alt="Sub 5">
          </div>
        </div>
      </div>

      <div class="tpl-cover-footer-banner">
        <span>İLİM</span>
        <span>•</span>
        <span>İMAN</span>
        <span>•</span>
        <span>İRFAN</span>
        <span>•</span>
        <span>İHSAN</span>
      </div>
    `;
    
    // Wire editing events
    const titleEl = canvasPage.querySelector('.issue-title');
    if (titleEl) {
      titleEl.addEventListener('input', (e) => {
        magTitleInput.value = e.target.innerText;
      });
    }
    
    const subtitleEl = canvasPage.querySelector('.tpl-cover-school-name');
    if (subtitleEl) {
      subtitleEl.addEventListener('input', (e) => {
        tplCoverSubtitle.value = e.target.innerText;
      });
    }
    
    const uploadBtn = canvasPage.querySelector('.canvas-image-upload-overlay');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tplCoverBgInput.click();
      });
    }

    const middleSec = canvasPage.querySelector('.tpl-cover-middle-section');
    if (middleSec) {
      middleSec.addEventListener('click', () => {
        tplCoverBgInput.click();
      });
      
      // Drag and drop cover background image
      middleSec.addEventListener('dragover', (e) => {
        e.preventDefault();
        middleSec.style.background = 'rgba(139, 92, 246, 0.15)';
      });
      middleSec.addEventListener('dragleave', () => {
        middleSec.style.background = 'transparent';
      });
      middleSec.addEventListener('drop', (e) => {
        e.preventDefault();
        middleSec.style.background = 'transparent';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const dt = new DataTransfer();
            dt.items.add(file);
            tplCoverBgInput.files = dt.files;
            tplCoverBgInput.dispatchEvent(new Event('change'));
          }
        }
      });
    }

    // Wire collage item click & drops
    canvasPage.querySelectorAll('.collage-item').forEach(item => {
      const subIdx = item.getAttribute('data-sub');
      const subInput = document.getElementById(`tpl-cover-sub${subIdx}-input`);
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        subInput.click();
      });
      
      subInput.onchange = () => {
        renderWorkspaceCanvas();
      };

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.style.opacity = '0.7';
      });
      item.addEventListener('dragleave', () => {
        item.style.opacity = '1';
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.style.opacity = '1';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const dt = new DataTransfer();
            dt.items.add(file);
            subInput.files = dt.files;
            subInput.dispatchEvent(new Event('change'));
          }
        }
      });
    });
    
    activePageCanvasWrapper.appendChild(canvasPage);
    
  } else {
    // Inner pages editor canvas
    const page = templatePages[activeEditorPageIndex];
    if (!page) return;
    
    activePageTitleLabel.textContent = `Sayfa ${activeEditorPageIndex + 1} Tasarımı`;
    activePageLayoutSelect.style.display = 'block';
    activePageLayoutSelect.value = page.layout;
    
    const canvasPage = document.createElement('div');
    canvasPage.className = 'template-page active-canvas-page';
    
    let headerHtml = `
      <div class="tpl-page-header">
        <span>HAKKIN İZİNDE</span>
        <span>İÇ İÇERİK</span>
      </div>
    `;
    
    let footerHtml = `
      <div class="tpl-page-footer">
        <span>Sayfa ${activeEditorPageIndex + 1}</span>
      </div>
    `;
    
    let contentHtml = '';
    
    if (page.layout === 'text-only') {
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-subtitle" contenteditable="true" data-placeholder="Kategori / Alt Başlık">${page.subtitle || ''}</div>
          <h2 class="tpl-title" contenteditable="true" data-placeholder="Sayfa Başlığı">${page.title || ''}</h2>
          <p class="tpl-paragraph" contenteditable="true" data-placeholder="Yazı içeriğini buraya yazın ya da panodan kopyalayıp yapıştırın...">${page.text || ''}</p>
        </div>
      `;
    } else if (page.layout === 'image-text' || page.layout === 'text-image') {
      let imgUrl = '';
      if (page.imageFile) {
        imgUrl = URL.createObjectURL(page.imageFile);
      } else if (page.imageUrl) {
        imgUrl = page.imageUrl;
      }
      
      let imgPlaceholder = `
        <div class="canvas-img-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color: var(--text-secondary); background: rgba(0,0,0,0.1); border: 2px dashed var(--border-glass); border-radius:8px; cursor:pointer;">
          <i data-lucide="image" style="width:24px; height:24px; margin-bottom:8px; opacity:0.6;"></i>
          <span style="font-size:0.7rem; text-align:center; padding:0 8px; opacity:0.6;">Resim Sürükleyin veya Tıklayın</span>
        </div>
      `;
      if (imgUrl) {
        imgPlaceholder = `<img class="tpl-img" src="${imgUrl}" alt="Görsel" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:6px; cursor:pointer;">`;
      }
      
      const textBlock = `
        <div class="tpl-text-box">
          <h2 class="tpl-title" contenteditable="true" data-placeholder="Yazı Başlığı" style="font-size: 1.25rem;">${page.title || ''}</h2>
          <p class="tpl-paragraph" contenteditable="true" data-placeholder="İçerik metni..." style="-webkit-line-clamp: 10;">${page.text || ''}</p>
        </div>
      `;
      
      const imgBlock = `<div class="tpl-img-container" style="position:relative; height:100%; min-height:200px;">${imgPlaceholder}</div>`;
      const layoutContent = page.layout === 'image-text' ? `${imgBlock}${textBlock}` : `${textBlock}${imgBlock}`;
      
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-layout-${page.layout}">
            ${layoutContent}
          </div>
        </div>
      `;
    } else if (page.layout === 'image-over-text') {
      let imgUrl = '';
      if (page.imageFile) {
        imgUrl = URL.createObjectURL(page.imageFile);
      } else if (page.imageUrl) {
        imgUrl = page.imageUrl;
      }
      
      let imgPlaceholder = `
        <div class="canvas-img-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color: var(--text-secondary); background: rgba(0,0,0,0.1); border: 2px dashed var(--border-glass); border-radius:8px; cursor:pointer;">
          <i data-lucide="image" style="width:24px; height:24px; margin-bottom:8px; opacity:0.6;"></i>
          <span style="font-size:0.7rem; text-align:center; opacity:0.6;">Resim Sürükleyin veya Tıklayın</span>
        </div>
      `;
      if (imgUrl) {
        imgPlaceholder = `<img class="tpl-img" src="${imgUrl}" alt="Görsel" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:6px; cursor:pointer;">`;
      }
      
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-layout-image-over-text">
            <div class="tpl-img-container" style="position:relative; height: 220px; min-height: 220px;">
              ${imgPlaceholder}
            </div>
            <div class="tpl-text-box" style="padding: 16px;">
              <h2 class="tpl-title" contenteditable="true" data-placeholder="Yazı Başlığı" style="font-size: 1.2rem; margin-bottom: 4px;">${page.title || ''}</h2>
              <p class="tpl-paragraph" contenteditable="true" data-placeholder="Görsel altı içerik metni..." style="-webkit-line-clamp: 6;">${page.text || ''}</p>
            </div>
          </div>
        </div>
      `;
    } else if (page.layout === 'full-image') {
      let imgUrl = '';
      if (page.imageFile) {
        imgUrl = URL.createObjectURL(page.imageFile);
      } else if (page.imageUrl) {
        imgUrl = page.imageUrl;
      }
      
      let imgPlaceholder = `
        <div class="canvas-img-placeholder" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color: var(--text-secondary); background: rgba(0,0,0,0.1); border: 2px dashed var(--border-glass); border-radius:8px; cursor:pointer;">
          <i data-lucide="image" style="width:32px; height:32px; margin-bottom:12px; opacity:0.6;"></i>
          <span style="font-size:0.8rem; text-align:center; opacity:0.6;">Tam Ekran Görsel Sürükleyin veya Tıklayın</span>
        </div>
      `;
      if (imgUrl) {
        imgPlaceholder = `<img class="tpl-img" src="${imgUrl}" alt="Görsel" style="width:100%; height:100%; object-fit:cover; display:block; cursor:pointer;">`;
      }
      
      contentHtml = `
        <div class="tpl-layout-full-image" style="width:100%; height:100%; position:relative;">
          ${imgPlaceholder}
        </div>
      `;
      headerHtml = '';
      footerHtml = '';
    }
    
    canvasPage.innerHTML = `
      ${headerHtml}
      ${contentHtml}
      ${footerHtml}
    `;
    
    // Wire editing events for inner elements
    const titleEl = canvasPage.querySelector('.tpl-title');
    if (titleEl) {
      titleEl.addEventListener('input', (e) => {
        page.title = e.target.innerText;
        renderEditorPageList(); // Sync title dynamically to sidebar!
      });
    }
    
    const subtitleEl = canvasPage.querySelector('.tpl-subtitle');
    if (subtitleEl) {
      subtitleEl.addEventListener('input', (e) => {
        page.subtitle = e.target.innerText;
      });
    }
    
    const paragraphEl = canvasPage.querySelector('.tpl-paragraph');
    if (paragraphEl) {
      paragraphEl.addEventListener('input', (e) => {
        page.text = e.target.innerText;
      });
    }
    
    // Bind image container upload and drop events
    const imgContainer = canvasPage.querySelector('.tpl-img-container') || canvasPage.querySelector('.tpl-layout-full-image');
    if (imgContainer) {
      imgContainer.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            page.imageFile = e.target.files[0];
            renderWorkspaceCanvas();
            renderEditorPageList();
          }
        });
        fileInput.click();
      });
      
      imgContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        imgContainer.style.outline = '2px dashed var(--accent-secondary)';
      });
      
      imgContainer.addEventListener('dragleave', () => {
        imgContainer.style.outline = 'none';
      });
      
      imgContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        imgContainer.style.outline = 'none';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            page.imageFile = file;
            renderWorkspaceCanvas();
            renderEditorPageList();
          }
        }
      });
    }
    
    activePageCanvasWrapper.appendChild(canvasPage);
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Form Submit - Publish or Update Magazine
addMagazineForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const activeTab = activeTabInput ? activeTabInput.value : 'classic';
  const formData = new FormData();
  
  formData.append('title', magTitleInput.value);
  formData.append('description', magDescInput.value);
  formData.append('publishDate', magDateInput.value);

  if (activeTab === 'classic') {
    // Only require cover if not editing and no existing cover loaded
    if (!editingMagazineId && !selectedCoverFile) {
      showToast('Lütfen kapak resmi yükleyin.', 'error');
      return;
    }

    // Only require pages if not editing
    if (!editingMagazineId && selectedPageFiles.length === 0) {
      showToast('Lütfen en az bir sayı sayfası yükleyin.', 'error');
      return;
    }

    if (selectedCoverFile) {
      formData.append('cover', selectedCoverFile);
    }
    formData.append('isTemplate', 'false');
    
    if (selectedPageFiles.length > 0) {
      selectedPageFiles.forEach(file => {
        formData.append('pages', file);
      });
    }
  } else {
    // Template builder mode
    if (templatePages.length === 0) {
      showToast('Lütfen şablona en az bir sayfa ekleyin.', 'error');
      return;
    }

    // Validation: make sure layouts with image have a selected file OR have an existing imageUrl
    for (let i = 0; i < templatePages.length; i++) {
      const page = templatePages[i];
      if (page.layout !== 'text-only' && !page.imageFile && !page.imageUrl) {
        showToast(`Sayfa ${i + 1} için görsel dosyası yüklemelisiniz.`, 'error');
        return;
      }
    }

    const templateData = {
      cover: {
        layout: 'cover-modern',
        title: magTitleInput.value,
        subtitle: tplCoverSubtitle.value,
        color: tplCoverColor.value,
        textcolor: tplCoverTextcolor.value,
        bgUrl: currentEditingMagazineData && currentEditingMagazineData.cover ? currentEditingMagazineData.cover.bgUrl : ''
      },
      pages: []
    };

    let imageCounter = 0;

    templatePages.forEach(page => {
      const pageData = {
        id: page.id,
        type: 'template',
        layout: page.layout,
        title: page.title || '',
        subtitle: page.subtitle || '',
        text: page.text || '',
        imageUrl: page.imageUrl || ''
      };

      if (page.layout !== 'text-only' && page.imageFile) {
        // Append image to form
        formData.append('template_images', page.imageFile);
        pageData.imageIndex = imageCounter;
        imageCounter++;
      }

      templateData.pages.push(pageData);
    });

    formData.append('isTemplate', 'true');
    formData.append('templateData', JSON.stringify(templateData));

    // Cover background if selected
    if (tplCoverBgInput && tplCoverBgInput.files.length > 0) {
      formData.append('cover', tplCoverBgInput.files[0]);
    }

    // Cover sub-images
    for (let i = 1; i <= 5; i++) {
      const subInput = document.getElementById(`tpl-cover-sub${i}-input`);
      if (subInput && subInput.files.length > 0) {
        formData.append(`cover_sub${i}`, subInput.files[0]);
      }
    }
  }

  const url = editingMagazineId ? `/api/magazines/${editingMagazineId}` : '/api/magazines';
  const method = editingMagazineId ? 'PUT' : 'POST';

  // Show upload overlay progress
  uploadOverlay.style.display = 'flex';
  uploadStatusTitle.textContent = editingMagazineId ? 'Sayı Güncelleniyor...' : 'Sayı Yayınlanıyor...';
  uploadStatusSub.textContent = 'Dosyalar sunucuya yükleniyor, lütfen bekleyin.';

  try {
    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast(editingMagazineId ? 'Sayı başarıyla güncellendi!' : 'Sayı başarıyla yayınlandı!');
      closeModal();
      fetchDashboardData();
    } else {
      throw new Error(data.error || 'Sayı yüklenirken bir hata oluştu.');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    uploadOverlay.style.display = 'none';
  }
});


// Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
