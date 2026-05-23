// State Management
let magazines = [];
let activeMagazine = null;
let currentPage = 0; // Represents the index of the page being read
let zoomLevel = 100;
let viewMode = 'double'; // 'single' or 'double'

// DOM Elements
const magazineGrid = document.getElementById('magazine-grid');
const searchInput = document.getElementById('search-input');
const loadingContainer = document.getElementById('loading-container');
const emptyState = document.getElementById('empty-state');
const adminNavBtn = document.getElementById('admin-nav-btn');

// Reader DOM Elements
const readerModal = document.getElementById('reader-modal');
const closeReaderBtn = document.getElementById('close-reader');
const readerMagTitle = document.getElementById('reader-mag-title');
const readerViewport = document.getElementById('reader-viewport');
const readerPages = document.getElementById('reader-pages');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageIndicator = document.getElementById('page-indicator');
const toggleViewModeBtn = document.getElementById('toggle-view-mode');
const toggleFullscreenBtn = document.getElementById('toggle-fullscreen');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomLevelText = document.getElementById('zoom-level');
const thumbnailsStrip = document.getElementById('thumbnails-strip');
const toastContainer = document.getElementById('toast-container');

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

// Check Admin Authentication Status
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth-status');
    const data = await res.json();
    if (data.isAdmin) {
      adminNavBtn.href = '/admin.html';
      adminNavBtn.querySelector('span').textContent = 'Yönetim Paneli';
      adminNavBtn.querySelector('i').setAttribute('data-lucide', 'sliders');
      initIcons();
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

// Fetch Magazines from API
async function fetchMagazines() {
  try {
    loadingContainer.style.display = 'flex';
    magazineGrid.innerHTML = '';
    emptyState.style.display = 'none';

    const res = await fetch('/api/magazines');
    if (!res.ok) throw new Error('Sayılar yüklenemedi.');
    
    magazines = await res.json();
    loadingContainer.style.display = 'none';

    if (magazines.length === 0) {
      emptyState.style.display = 'block';
    } else {
      renderMagazines(magazines);
    }
  } catch (error) {
    loadingContainer.style.display = 'none';
    emptyState.style.display = 'block';
    showToast(error.message, 'error');
  }
}

// Render Magazine Grid Cards
function renderMagazines(magsToRender) {
  magazineGrid.innerHTML = '';
  
  magsToRender.forEach(mag => {
    const publishDateFormatted = new Date(mag.publishDate).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let coverHtml = '';
    if (mag.isTemplate && !mag.coverUrl) {
      const color = mag.cover ? mag.cover.color : 'violet';
      let gradientStyle = 'linear-gradient(135deg, #2e1065 0%, #0f052d 100%)';
      if (color === 'emerald') gradientStyle = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)';
      else if (color === 'crimson') gradientStyle = 'linear-gradient(135deg, #881337 0%, #4c0519 100%)';
      else if (color === 'amber') gradientStyle = 'linear-gradient(135deg, #78350f 0%, #451a03 100%)';
      else if (color === 'dark') gradientStyle = 'linear-gradient(135deg, #18181b 0%, #09090b 100%)';
      
      coverHtml = `
        <div style="width: 100%; height: 100%; background: ${gradientStyle}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 24px; text-align: center; color: white; position: relative; overflow: hidden; border-radius: 4px;">
          <div style="border: 1px solid rgba(255,255,255,0.4); padding: 4px 10px; border-radius: 12px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 600; font-family: var(--font-body); background: rgba(255,255,255,0.05);">Hakkın İzinde</div>
          <div style="font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; line-height: 1.2; word-break: break-word;">${escapeHtml(mag.title)}</div>
        </div>`;
    } else {
      coverHtml = `<img class="card-cover" src="${mag.coverUrl}" alt="${mag.title}" loading="lazy">`;
    }

    const card = document.createElement('div');
    card.className = 'magazine-card glass';
    card.innerHTML = `
      <div class="card-cover-container">
        ${coverHtml}
        <div class="card-overlay">
          <button class="btn btn-primary btn-sm read-btn" data-id="${mag.id}" style="width: 100%;">
            <i data-lucide="book-open"></i>
            <span>Sayıyı Oku</span>
          </button>
        </div>
      </div>
      <div class="card-content">
        <div class="card-date">${publishDateFormatted}</div>
        <h3 class="card-title">${escapeHtml(mag.title)}</h3>
        <p class="card-desc">${escapeHtml(mag.description) || 'Açıklama bulunmuyor.'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; font-size: 0.85rem; color: var(--text-secondary);">
          <span>${mag.pages.length + 1} Sayfa</span>
          <button class="btn btn-secondary btn-sm read-btn-link" data-id="${mag.id}" style="padding: 4px 8px; font-size: 0.75rem;">Oku</button>
        </div>
      </div>
    `;
    magazineGrid.appendChild(card);
  });

  // Attach event listeners to Oku buttons
  document.querySelectorAll('.read-btn, .read-btn-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const magId = btn.getAttribute('data-id');
      openReader(magId);
    });
  });

  initIcons();
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

// --- READER LOGIC ---

// Open Reader Overlay
function openReader(magId) {
  activeMagazine = magazines.find(m => m.id === magId);
  if (!activeMagazine) return;

  readerMagTitle.textContent = activeMagazine.title;
  currentPage = 0;
  zoomLevel = 100;
  updateZoom();

  // Set default view mode based on screen width
  if (window.innerWidth < 900) {
    viewMode = 'single';
    toggleViewModeBtn.querySelector('span').textContent = 'Tek Sayfa';
  } else {
    viewMode = 'double';
    toggleViewModeBtn.querySelector('span').textContent = 'Çift Sayfa';
  }

  // Render Thumbnails strip
  renderThumbnails();

  // Render initial pages
  renderReaderPages();

  // Display modal
  readerModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop page scroll
}

// Render Thumbnails strip
function renderThumbnails() {
  thumbnailsStrip.innerHTML = '';
  
  let allPages = [];
  if (activeMagazine.isTemplate) {
    const coverTpl = {
      layout: 'cover-modern',
      title: activeMagazine.title,
      subtitle: activeMagazine.cover ? activeMagazine.cover.subtitle : '',
      color: activeMagazine.cover ? activeMagazine.cover.color : 'violet',
      textcolor: activeMagazine.cover ? activeMagazine.cover.textcolor : '#ffffff',
      bgUrl: activeMagazine.cover ? activeMagazine.cover.bgUrl : ''
    };
    allPages = [coverTpl, ...activeMagazine.pages];
  } else {
    allPages = [activeMagazine.coverUrl, ...activeMagazine.pages];
  }
  
  allPages.forEach((page, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === currentPage ? 'active' : ''}`;
    thumb.setAttribute('data-index', idx);
    
    if (typeof page === 'object') {
      const thumbSrc = page.bgUrl || page.imageUrl || '';
      if (thumbSrc) {
        thumb.innerHTML = `<img class="thumb-img" src="${thumbSrc}" alt="Sayfa ${idx}" loading="lazy">`;
      } else {
        const titleText = page.layout === 'cover-modern' ? 'Kapak' : `Sayfa ${idx + 1}`;
        const layoutText = page.layout === 'cover-modern' ? 'KAPAK' : (page.title ? page.title.substring(0, 10) : 'METİN');
        thumb.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #1f2937; color: #fff; font-size: 0.55rem; font-family: sans-serif; text-transform: uppercase; padding: 4px; font-weight: bold; text-align: center; border-radius: 2px;">
            <div style="font-size:0.4rem; opacity:0.7;">${titleText}</div>
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${layoutText}</div>
          </div>`;
      }
    } else {
      thumb.innerHTML = `<img class="thumb-img" src="${page}" alt="Sayfa ${idx}" loading="lazy">`;
    }
    
    thumb.addEventListener('click', () => {
      jumpToPage(idx);
    });
    
    thumbnailsStrip.appendChild(thumb);
  });
}

// Update Active Thumbnail class
function updateActiveThumbnail() {
  document.querySelectorAll('.thumb-item').forEach((thumb, idx) => {
    if (viewMode === 'double' && currentPage > 0) {
      // In double page mode, highlight both visible pages
      if (idx === currentPage || idx === currentPage + 1) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    } else {
      if (idx === currentPage) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    }
  });

  // Scroll active thumbnail into view
  const activeThumb = document.querySelector('.thumb-item.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Render Pages inside reader view
function renderReaderPages() {
  readerPages.innerHTML = '';
  
  let allPages = [];
  if (activeMagazine.isTemplate) {
    const coverTpl = {
      layout: 'cover-modern',
      title: activeMagazine.title,
      subtitle: activeMagazine.cover ? activeMagazine.cover.subtitle : '',
      color: activeMagazine.cover ? activeMagazine.cover.color : 'violet',
      textcolor: activeMagazine.cover ? activeMagazine.cover.textcolor : '#ffffff',
      bgUrl: activeMagazine.cover ? activeMagazine.cover.bgUrl : ''
    };
    allPages = [coverTpl, ...activeMagazine.pages];
  } else {
    allPages = [activeMagazine.coverUrl, ...activeMagazine.pages];
  }

  const total = allPages.length;

  if (viewMode === 'double' && window.innerWidth >= 900) {
    if (currentPage === 0) {
      // Cover page (Page 1) is rendered single page centered
      const element = createPageElement(allPages[0], 0, total);
      
      const wrapper = document.createElement('div');
      wrapper.className = 'reader-page-wrapper';
      wrapper.appendChild(element);
      readerPages.appendChild(wrapper);
      
      pageIndicator.textContent = `Kapak (Sayfa 1 / ${total})`;
    } else {
      // Left Page
      const leftElement = createPageElement(allPages[currentPage], currentPage, total);
      
      const leftWrapper = document.createElement('div');
      leftWrapper.className = 'reader-page-wrapper';
      leftWrapper.appendChild(leftElement);
      readerPages.appendChild(leftWrapper);

      // Right Page (if exists)
      if (currentPage + 1 < total) {
        const rightElement = createPageElement(allPages[currentPage + 1], currentPage + 1, total);
        
        const rightWrapper = document.createElement('div');
        rightWrapper.className = 'reader-page-wrapper';
        rightWrapper.appendChild(rightElement);
        readerPages.appendChild(rightWrapper);

        pageIndicator.textContent = `Sayfa ${currentPage + 1} - ${currentPage + 2} / ${total}`;
      } else {
        pageIndicator.textContent = `Sayfa ${currentPage + 1} / ${total}`;
      }
    }
  } else {
    // Single page mode
    const element = createPageElement(allPages[currentPage], currentPage, total);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'reader-page-wrapper';
    wrapper.appendChild(element);
    readerPages.appendChild(wrapper);

    pageIndicator.textContent = currentPage === 0 
      ? `Kapak (Sayfa 1 / ${total})` 
      : `Sayfa ${currentPage + 1} / ${total}`;
  }

  // Update nav buttons disabled status
  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = isLastPage();
  prevPageBtn.style.opacity = currentPage === 0 ? '0.3' : '1';
  nextPageBtn.style.opacity = isLastPage() ? '0.3' : '1';

  updateActiveThumbnail();
}

// Helper to create page element (image or structured template DOM)
function createPageElement(page, index, total) {
  if (typeof page === 'object' && page !== null) {
    return createTemplatePageHtml(page, index, total);
  } else {
    const img = document.createElement('img');
    img.className = 'reader-img';
    img.src = page;
    img.alt = index === 0 ? 'Kapak' : `Sayfa ${index + 1}`;
    return img;
  }
}

// Build editorial/magazine page components in HTML
function createTemplatePageHtml(page, pageNum, totalPages) {
  const div = document.createElement('div');
  
  if (page.layout === 'cover-modern') {
    div.className = `template-page cover-template-custom cover-template-${page.color || 'violet'}`;
    
    let bgImgHtml = '';
    if (page.bgUrl) {
      bgImgHtml = `<img class="tpl-cover-bg-image" src="${page.bgUrl}" alt="Arka Plan">`;
    }

    const subUrls = [];
    for (let i = 1; i <= 5; i++) {
      if (page.subImages && page.subImages[i - 1]) {
        subUrls.push(page.subImages[i - 1]);
      } else {
        subUrls.push(`/images/sub${i}.png`);
      }
    }
    
    div.innerHTML = `
      <div class="tpl-cover-top-section" style="border-bottom: 2px solid ${page.textcolor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}; color: ${page.textcolor || '#ffffff'};">
        <div class="tpl-cover-header-left">
          <h1 class="tpl-cover-main-title">HAKKIN İZİNDE</h1>
          <div class="tpl-cover-school-name">${escapeHtml(page.subtitle || 'HACI AVNİ KIZ İMAM HATİP LİSESİ')}</div>
        </div>
        <div class="tpl-cover-header-right">
          <div class="tpl-cover-calligraphy">
            <span class="arabic">ایمان</span>
            <span class="translation">"Rabbim! İlmimi artır."</span>
            <span class="ref">Tâ-Hâ Sûresi, 114</span>
          </div>
        </div>
      </div>

      <div class="tpl-cover-middle-section" style="position: relative; flex-grow: 1; min-height: 200px;">
        ${bgImgHtml || `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:rgba(255,255,255,0.4); background: rgba(0,0,0,0.25); font-size:0.8rem;"><i data-lucide="image" style="width:24px; height:24px; margin-bottom:6px;"></i>Kapak Arka Planı Yok</div>`}
        <div class="tpl-cover-issue-badge">
          <span class="issue-title">${escapeHtml(page.title)}</span>
          <span class="issue-date">${activeMagazine ? new Date(activeMagazine.publishDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : ''}</span>
        </div>
      </div>

      <div class="tpl-cover-collage-section">
        <div class="collage-clip-path-wrapper">
          <div class="collage-item clip-panel-1">
            <img src="${subUrls[0]}" alt="Sub 1">
          </div>
          <div class="collage-item clip-panel-2">
            <img src="${subUrls[1]}" alt="Sub 2">
          </div>
          <div class="collage-item clip-panel-3">
            <img src="${subUrls[2]}" alt="Sub 3">
          </div>
          <div class="collage-item clip-panel-4">
            <img src="${subUrls[3]}" alt="Sub 4">
          </div>
          <div class="collage-item clip-panel-5">
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
  } else {
    div.className = 'template-page';
    
    let headerHtml = `
      <div class="tpl-page-header">
        <span>HAKKIN İZİNDE</span>
        <span>Sayı: ${activeMagazine ? activeMagazine.title : ''}</span>
      </div>
    `;
    
    let footerHtml = `
      <div class="tpl-page-footer">
        <span>Sayfa ${pageNum}</span>
        <span>${activeMagazine ? new Date(activeMagazine.publishDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : ''}</span>
      </div>
    `;
    
    let contentHtml = '';
    
    if (page.layout === 'text-only') {
      contentHtml = `
        <div class="tpl-page-content">
          ${page.subtitle ? `<div class="tpl-subtitle">${escapeHtml(page.subtitle)}</div>` : ''}
          ${page.title ? `<h2 class="tpl-title">${escapeHtml(page.title)}</h2>` : ''}
          ${page.text ? `<p class="tpl-paragraph">${escapeHtml(page.text).replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      `;
    } else if (page.layout === 'image-text') {
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-layout-image-text">
            <div class="tpl-img-container">
              <img class="tpl-img" src="${page.imageUrl || ''}" alt="Görsel" loading="lazy">
            </div>
            <div class="tpl-text-box">
              ${page.title ? `<h2 class="tpl-title" style="font-size: 1.25rem;">${escapeHtml(page.title)}</h2>` : ''}
              ${page.text ? `<p class="tpl-paragraph" style="-webkit-line-clamp: 10;">${escapeHtml(page.text).replace(/\n/g, '<br>')}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (page.layout === 'text-image') {
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-layout-text-image">
            <div class="tpl-text-box">
              ${page.title ? `<h2 class="tpl-title" style="font-size: 1.25rem;">${escapeHtml(page.title)}</h2>` : ''}
              ${page.text ? `<p class="tpl-paragraph" style="-webkit-line-clamp: 10;">${escapeHtml(page.text).replace(/\n/g, '<br>')}</p>` : ''}
            </div>
            <div class="tpl-img-container">
              <img class="tpl-img" src="${page.imageUrl || ''}" alt="Görsel" loading="lazy">
            </div>
          </div>
        </div>
      `;
    } else if (page.layout === 'image-over-text') {
      contentHtml = `
        <div class="tpl-page-content">
          <div class="tpl-layout-image-over-text">
            <div class="tpl-img-container" style="height: 220px; min-height: 220px;">
              <img class="tpl-img" src="${page.imageUrl || ''}" alt="Görsel" loading="lazy">
            </div>
            <div class="tpl-text-box" style="padding: 16px;">
              ${page.title ? `<h2 class="tpl-title" style="font-size: 1.2rem; margin-bottom: 4px;">${escapeHtml(page.title)}</h2>` : ''}
              ${page.text ? `<p class="tpl-paragraph" style="-webkit-line-clamp: 6;">${escapeHtml(page.text).replace(/\n/g, '<br>')}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (page.layout === 'full-image') {
      contentHtml = `
        <div class="tpl-layout-full-image">
          <img src="${page.imageUrl || ''}" alt="Görsel" loading="lazy">
        </div>
      `;
      headerHtml = '';
      footerHtml = '';
    }
    
    div.innerHTML = `
      ${headerHtml}
      ${contentHtml}
      ${footerHtml}
    `;
  }
  
  return div;
}

// Check if currently viewing the last page
function isLastPage() {
  const total = 1 + activeMagazine.pages.length;
  if (viewMode === 'double' && window.innerWidth >= 900) {
    if (currentPage === 0) {
      return total <= 1;
    }
    return currentPage + 2 >= total;
  }
  return currentPage >= total - 1;
}

// Go to next page
function nextPage() {
  if (isLastPage()) return;

  const total = 1 + activeMagazine.pages.length;
  if (viewMode === 'double' && window.innerWidth >= 900) {
    if (currentPage === 0) {
      currentPage = 1;
    } else {
      currentPage = Math.min(currentPage + 2, total - 1);
    }
  } else {
    currentPage = Math.min(currentPage + 1, total - 1);
  }
  renderReaderPages();
}

// Go to previous page
function prevPage() {
  if (currentPage === 0) return;

  if (viewMode === 'double' && window.innerWidth >= 900) {
    if (currentPage === 1) {
      currentPage = 0;
    } else {
      currentPage = Math.max(currentPage - 2, 0);
    }
  } else {
    currentPage = Math.max(currentPage - 1, 0);
  }
  renderReaderPages();
}

// Jump to specific page index directly
function jumpToPage(index) {
  const total = 1 + activeMagazine.pages.length;
  if (index < 0 || index >= total) return;

  if (viewMode === 'double' && window.innerWidth >= 900) {
    if (index === 0) {
      currentPage = 0;
    } else {
      // Set to the left page index (must be odd index, meaning pages 2-3, 4-5...)
      currentPage = index % 2 === 0 ? index - 1 : index;
    }
  } else {
    currentPage = index;
  }
  renderReaderPages();
}

// Zoom helpers
function updateZoom() {
  readerViewport.style.transform = `scale(${zoomLevel / 100})`;
  zoomLevelText.textContent = `${zoomLevel}%`;
}

// Close Reader Modal
function closeReader() {
  readerModal.classList.remove('active');
  document.body.style.overflow = 'auto'; // Re-enable page scroll
  activeMagazine = null;
  
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.error(err));
  }
}

// Toggle Fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    readerModal.requestFullscreen().catch(err => {
      showToast(`Tam ekrana geçiş hatası: ${err.message}`, 'error');
    });
  } else {
    document.exitFullscreen();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  fetchMagazines();

  // Search input filter
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === '') {
      renderMagazines(magazines);
    } else {
      const filtered = magazines.filter(mag => 
        mag.title.toLowerCase().includes(query) || 
        mag.description.toLowerCase().includes(query)
      );
      renderMagazines(filtered);
    }
  });

  // Header change on scroll
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Reader Event Listeners
  closeReaderBtn.addEventListener('click', closeReader);
  prevPageBtn.addEventListener('click', prevPage);
  nextPageBtn.addEventListener('click', nextPage);

  zoomInBtn.addEventListener('click', () => {
    if (zoomLevel < 250) {
      zoomLevel += 25;
      updateZoom();
    }
  });

  zoomOutBtn.addEventListener('click', () => {
    if (zoomLevel > 100) {
      zoomLevel -= 25;
      updateZoom();
    }
  });

  toggleViewModeBtn.addEventListener('click', () => {
    if (viewMode === 'double') {
      viewMode = 'single';
      toggleViewModeBtn.querySelector('span').textContent = 'Tek Sayfa';
    } else {
      viewMode = 'double';
      toggleViewModeBtn.querySelector('span').textContent = 'Çift Sayfa';
    }
    
    // Adjust current page positioning when switching modes
    if (currentPage > 0 && currentPage % 2 === 0 && viewMode === 'double') {
      currentPage--; // aligns with left page starting index
    }
    
    renderReaderPages();
  });

  toggleFullscreenBtn.addEventListener('click', toggleFullscreen);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!activeMagazine) return;
    
    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    } else if (e.key === 'Escape') {
      closeReader();
    }
  });

  // Listen to fullscreen changes to update icon
  document.addEventListener('fullscreenchange', () => {
    const icon = toggleFullscreenBtn.querySelector('i');
    if (document.fullscreenElement) {
      icon.setAttribute('data-lucide', 'minimize-2');
    } else {
      icon.setAttribute('data-lucide', 'maximize-2');
    }
    initIcons();
  });

  // Re-render viewer pages on window resize (switches double-page view correctly)
  window.addEventListener('resize', () => {
    if (activeMagazine) {
      renderReaderPages();
    }
  });
});
