(function initGalleryPage() {
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const filters = document.querySelectorAll('.gallery-filter-btn');
  const loadMore = document.getElementById('load-more-btn');
  const openGallery = document.getElementById('vr-play-button');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const closeButton = document.getElementById('lightbox-close');
  let returnFocus = null;

  const showPhoto = (item) => {
    const image = item.querySelector('img');
    if (!image || !lightbox || !lightboxImage) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || image.dataset.alt || 'Photo illustrative de la maquette';
    document.getElementById('lightbox-title').textContent = item.dataset.title || 'Photo illustrative';
    document.getElementById('lightbox-subtitle').textContent = item.dataset.subtitle || '';
    lightbox.classList.remove('hidden', 'pointer-events-none');
    window.requestAnimationFrame(() => lightbox.classList.add('opacity-100'));
    closeButton?.focus();
  };

  items.forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-haspopup', 'dialog');
    item.addEventListener('click', () => showPhoto(item));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showPhoto(item);
      }
    });
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filters.forEach((item) => {
        const active = item === button;
        item.classList.remove('bg-sun-gold', 'text-espresso-dark', 'font-bold', 'shadow-[0_4px_16px_rgba(229,169,60,0.3)]');
        item.classList.add('bg-surface-container-lowest', 'text-secondary', 'border', 'border-warm-border/60');
        if (active) {
          item.classList.add('bg-sun-gold', 'text-espresso-dark', 'font-bold', 'shadow-[0_4px_16px_rgba(229,169,60,0.3)]');
          item.classList.remove('bg-surface-container-lowest', 'text-secondary', 'border-warm-border/60');
        }
      });
      items.forEach((item) => {
        item.style.display = category === 'all' || item.dataset.category === category ? '' : 'none';
      });
    });
  });

  // This export contains seven photographs and no hidden second page of images.
  // Hide the old progressive-load control when there is nothing left to reveal.
  if (loadMore) {
    const hiddenItems = items.filter((item) => item.hidden || getComputedStyle(item).display === 'none');
    if (hiddenItems.length === 0) loadMore.hidden = true;
    else loadMore.addEventListener('click', () => hiddenItems.forEach((item) => { item.hidden = false; item.style.display = ''; }));
  }

  openGallery?.addEventListener('click', () => {
    const firstVisible = items.find((item) => getComputedStyle(item).display !== 'none');
    firstVisible?.click();
    document.getElementById('lightbox-close')?.focus();
  });

  const openPhoto = document.querySelector('#vr-play-button')?.closest('section')?.querySelector('button:not(#vr-play-button)');
  openPhoto?.addEventListener('click', () => {
    const firstVisible = items.find((item) => getComputedStyle(item).display !== 'none');
    firstVisible?.click();
    document.getElementById('lightbox-close')?.focus();
  });

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) document.getElementById('lightbox-close')?.click();
    });
  }

  closeButton?.addEventListener('click', () => {
    lightbox?.classList.remove('opacity-100');
    window.setTimeout(() => lightbox?.classList.add('hidden', 'pointer-events-none'), 300);
    returnFocus?.focus();
  });
})();
