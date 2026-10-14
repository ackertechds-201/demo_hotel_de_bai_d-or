(function initGallery() {
      const filterButtons = document.querySelectorAll('.gallery-filter-btn');
      const galleryItems = document.querySelectorAll('.gallery-item');
      const lightbox = document.getElementById('gallery-lightbox');
      const lightboxImage = document.getElementById('lightbox-image');
      const lightboxTitle = document.getElementById('lightbox-title');
      const lightboxSubtitle = document.getElementById('lightbox-subtitle');
      const lightboxClose = document.getElementById('lightbox-close');
      const vrPlayBtn = document.getElementById('vr-play-button');
      const loadMoreBtn = document.getElementById('load-more-btn');

      // Filter functionality
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter');

          filterButtons.forEach(b => {
            b.classList.remove('bg-sun-gold', 'text-espresso-dark', 'font-bold', 'shadow-[0_4px_16px_rgba(229,169,60,0.3)]');
            b.classList.add('bg-surface-container-lowest', 'text-secondary', 'border', 'border-warm-border/60');
          });

          btn.classList.add('bg-sun-gold', 'text-espresso-dark', 'font-bold', 'shadow-[0_4px_16px_rgba(229,169,60,0.3)]');
          btn.classList.remove('bg-surface-container-lowest', 'text-secondary', 'border-warm-border/60');

          galleryItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        });
      });

      // Lightbox simulation
      galleryItems.forEach(item => {
        item.addEventListener('click', () => {
          const title = item.getAttribute('data-title');
          const subtitle = item.getAttribute('data-subtitle');
          const img = item.querySelector('img');

          if (img && lightbox && lightboxImage) {
            lightboxImage.src = img.src;
            lightboxImage.setAttribute('data-alt', img.getAttribute('data-alt') || '');
            lightboxTitle.textContent = title;
            lightboxSubtitle.textContent = subtitle;

            lightbox.classList.remove('hidden', 'pointer-events-none');
            setTimeout(() => {
              lightbox.classList.add('opacity-100');
            }, 10);
          }
        });
      });

      if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
          lightbox.classList.remove('opacity-100');
          setTimeout(() => {
            lightbox.classList.add('hidden', 'pointer-events-none');
          }, 300);
        });
      }

      // VR Button Toast simulation
      if (vrPlayBtn) {
        vrPlayBtn.addEventListener('click', () => {
          const toast = document.createElement('div');
          toast.className = 'bg-espresso-dark text-pale-vanilla px-4 py-3 rounded-2xl shadow-xl font-body-sm text-body-sm flex items-center gap-2 border-l-4 border-sun-gold transition-all';
          toast.innerHTML = '<span class="material-symbols-outlined text-sun-gold text-[20px]">vrpano</span> Visite 360° en cours de chargement... (Mode Démonstration)';
          const notifContainer = document.getElementById('notification-container');
          if (notifContainer) {
            notifContainer.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
          }
        });
      }

      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          loadMoreBtn.textContent = 'Toutes les photos sont affichées (36/36)';
          loadMoreBtn.disabled = true;
          loadMoreBtn.classList.add('opacity-70', 'cursor-default');
        });
      }
    })();
