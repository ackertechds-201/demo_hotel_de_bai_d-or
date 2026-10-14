(function() {
      const DISPLAY_MGA_PER_EUR = 5085 / 25;
      const formatMGA = (amountInEuros) => `${(Math.round(amountInEuros * DISPLAY_MGA_PER_EUR / 100) * 100).toLocaleString('fr-FR')} Ar`;
      const categoryButtons = document.querySelectorAll('.filter-category-btn');
      const viewSelect = document.getElementById('filter-view');
      const capacitySelect = document.getElementById('filter-capacity');
      const sortSelect = document.getElementById('filter-sort');
      const cards = Array.from(document.querySelectorAll('.room-card'));
      const countEl = document.getElementById('results-count');
      const noResultsMsg = document.getElementById('no-results-msg');
      const resetBtn = document.getElementById('reset-filters');
      const resetEmptyBtn = document.getElementById('reset-empty-btn');
      const grid = document.getElementById('rooms-grid');

      let currentCategory = 'all';

      function applyFilters() {
        const viewVal = viewSelect.value;
        const capVal = capacitySelect.value;
        const sortVal = sortSelect.value;

        let visibleCards = cards.filter(card => {
          const cat = card.getAttribute('data-category');
          const v = card.getAttribute('data-view');
          const c = card.getAttribute('data-capacity');

          const matchCat = (currentCategory === 'all' || cat === currentCategory);
          const matchView = (viewVal === 'all' || v === viewVal);
          const matchCap = (capVal === 'all' || c === capVal);

          return matchCat && matchView && matchCap;
        });

        // Sorting logic
        if (sortVal === 'asc') {
          visibleCards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
        } else if (sortVal === 'desc') {
          visibleCards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
        } else if (sortVal === 'surface') {
          visibleCards.sort((a, b) => parseInt(b.dataset.surface) - parseInt(a.dataset.surface));
        }

        // Reorder and show/hide
        cards.forEach(card => card.style.display = 'none');

        visibleCards.forEach(card => {
          card.style.display = 'flex';
          grid.appendChild(card);
        });

        const count = visibleCards.length;
        countEl.textContent = count + (count > 1 ? ' Hébergements' : ' Hébergement');

        if (count === 0) {
          noResultsMsg.classList.remove('hidden');
          noResultsMsg.classList.add('flex');
        } else {
          noResultsMsg.classList.add('hidden');
          noResultsMsg.classList.remove('flex');
        }
      }

      categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          categoryButtons.forEach(b => {
            b.classList.remove('bg-sun-gold', 'text-espresso-dark', 'font-semibold');
            b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
          });
          btn.classList.add('bg-sun-gold', 'text-espresso-dark', 'font-semibold');
          btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');

          currentCategory = btn.getAttribute('data-category');
          applyFilters();
        });
      });

      viewSelect.addEventListener('change', applyFilters);
      capacitySelect.addEventListener('change', applyFilters);
      sortSelect.addEventListener('change', applyFilters);

      function resetAll() {
        currentCategory = 'all';
        categoryButtons.forEach((b, idx) => {
          if (idx === 0) {
            b.classList.add('bg-sun-gold', 'text-espresso-dark', 'font-semibold');
            b.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
          } else {
            b.classList.remove('bg-sun-gold', 'text-espresso-dark', 'font-semibold');
            b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
          }
        });
        viewSelect.value = 'all';
        capacitySelect.value = 'all';
        sortSelect.value = 'default';
        [viewSelect, capacitySelect, sortSelect].forEach(select => select.dispatchEvent(new Event('change', { bubbles: true })));
        applyFilters();
      }

      resetBtn.addEventListener('click', resetAll);
      if (resetEmptyBtn) resetEmptyBtn.addEventListener('click', resetAll);

      // Simulation Modal Logic
      const modal = document.getElementById('booking-modal');
      const closeModalBtn = document.getElementById('close-modal-btn');
      const simButtons = document.querySelectorAll('.simulate-book-btn');
      const detailsButtons = document.querySelectorAll('.open-details-btn');
      const modalTitle = document.getElementById('modal-room-title');
      const modalPriceDisplay = document.getElementById('modal-room-price-display');
      const modalTotalPrice = document.getElementById('modal-total-price');
      const confirmSimBtn = document.getElementById('confirm-simulation-btn');
      const conciergeCta = document.getElementById('open-concierge-modal');

      function openModal(title, price) {
        modalTitle.textContent = title;
        modalPriceDisplay.textContent = 'Tarif indicatif : ' + formatMGA(price) + ' / nuitée';
        modalTotalPrice.textContent = formatMGA(price * 5) + ' (séjour 5 nuits)';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      simButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const title = btn.getAttribute('data-room-title');
          const price = parseInt(btn.getAttribute('data-room-price') || '300');
          openModal(title, price);
        });
      });

      detailsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.room-card');
          const title = card.querySelector('h2').textContent;
          const price = parseInt(card.getAttribute('data-price') || '300');
          openModal(title, price);
        });
      });

      if (conciergeCta) {
        conciergeCta.addEventListener('click', () => {
          openModal('Séjour Sur-Mesure & Conciergerie Privée', 600);
        });
      }

      closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      });

      confirmSimBtn.addEventListener('click', () => {
        const notif = document.getElementById('notification-container');
        if (notif) {
          const toast = document.createElement('div');
          toast.className = 'bg-espresso-dark text-pale-vanilla px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-opacity duration-300 pointer-events-auto border border-warm-border/30';
          toast.innerHTML = '<span class="material-symbols-outlined text-sun-gold text-[20px]">check_circle</span><span class="font-label-md text-[13px]">Simulation enregistrée ! Démonstration sans débit réel.</span>';
          notif.appendChild(toast);
          setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
          }, 4000);
        }
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      });
    })();
