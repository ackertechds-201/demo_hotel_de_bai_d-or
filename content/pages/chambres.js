(function() {
      const DISPLAY_MGA_PER_EUR = 5085 / 25;
      const formatMGA = (amountInEuros) => `${(Math.round(amountInEuros * DISPLAY_MGA_PER_EUR / 100) * 100).toLocaleString('fr-FR')} Ar`;
      const toMGA = (amountInEuros) => Math.round(amountInEuros * DISPLAY_MGA_PER_EUR / 100) * 100;
      const formatAr = (amountInMGA) => `${amountInMGA.toLocaleString('fr-FR')} Ar`;
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
      const searchParams = new URLSearchParams(window.location.search);
      let requestedStay = ['tout-inclus', 'nuitee', 'lune-miel', 'villa-privee'].includes(searchParams.get('stay')) ? searchParams.get('stay') : '';
      let requestedLodging = ['toutes', 'deluxe', 'suite-ocean', 'villa-privee'].includes(searchParams.get('lodging')) ? searchParams.get('lodging') : '';
      let requestedGuests = ({ '1-adulte': 1, '2-adultes': 2, 'famille-4': 4, 'groupe': 6 })[searchParams.get('guests')] || 0;

      let currentCategory = 'all';

      function requiredCategories() {
        const categories = [];
        if (requestedLodging === 'deluxe') categories.push('lagoon');
        if (requestedLodging === 'villa-privee' || requestedStay === 'villa-privee') categories.push('villa');
        if (requestedStay === 'lune-miel') categories.push('lagoon');
        return categories;
      }

      function capacityLimit(value) {
        if (value === 'family') return 6;
        return Number.parseInt(value, 10) || 0;
      }

      function applyFilters() {
        const viewVal = viewSelect.value;
        const capVal = capacitySelect.value;
        const sortVal = sortSelect.value;
        const categoryConstraints = requiredCategories();
        const minimumGuests = Math.max(requestedGuests, capacityLimit(capVal));
        const requestedView = requestedLodging === 'suite-ocean' ? 'mer' : '';

        let visibleCards = cards.filter(card => {
          const cat = card.getAttribute('data-category');
          const v = card.getAttribute('data-view');
          const c = card.getAttribute('data-capacity');

          const matchCat = (currentCategory === 'all' || cat === currentCategory) && categoryConstraints.every(category => cat === category);
          const matchView = (viewVal === 'all' || v === viewVal) && (!requestedView || v === requestedView);
          const roomCapacity = c === 'family' ? 8 : Number.parseInt(c, 10) || 0;
          const matchCap = roomCapacity >= minimumGuests;
          const matchStay = !requestedStay || requestedStay === 'tout-inclus' || requestedStay === 'nuitee' ||
            (requestedStay === 'lune-miel' && cat === 'lagoon') ||
            (requestedStay === 'villa-privee' && cat === 'villa');

          return matchCat && matchView && matchCap && matchStay;
        });

        if (sortVal === 'asc') {
          visibleCards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
        } else if (sortVal === 'desc') {
          visibleCards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
        } else if (sortVal === 'surface') {
          visibleCards.sort((a, b) => parseInt(b.dataset.surface) - parseInt(a.dataset.surface));
        }

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
        requestedStay = '';
        requestedLodging = '';
        requestedGuests = 0;
        const cleanUrl = new URL(window.location.href);
        ['stay', 'lodging', 'guests'].forEach(key => cleanUrl.searchParams.delete(key));
        window.history.replaceState({}, '', cleanUrl);
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

      const categories = requiredCategories();
      const uniqueCategories = [...new Set(categories)];
      if (uniqueCategories.length === 1) currentCategory = uniqueCategories[0];
      categoryButtons.forEach(button => {
        const selected = button.getAttribute('data-category') === currentCategory;
        button.classList.toggle('bg-sun-gold', selected);
        button.classList.toggle('text-espresso-dark', selected);
        button.classList.toggle('font-semibold', selected);
        button.classList.toggle('bg-surface-container-low', !selected);
        button.classList.toggle('text-on-surface-variant', !selected);
      });
      if (requestedLodging === 'suite-ocean') viewSelect.value = 'mer';
      const requestedCapacity = requestedGuests >= 6 ? 'family' : requestedGuests >= 4 ? '4' : requestedGuests >= 2 ? '2' : 'all';
      if (requestedCapacity !== 'all') capacitySelect.value = requestedCapacity;
      if (requestedStay || requestedLodging || requestedGuests) applyFilters();

      const modal = document.getElementById('booking-modal');
      const closeModalBtn = document.getElementById('close-modal-btn');
      const simButtons = document.querySelectorAll('.simulate-book-btn');
      const modalTitle = document.getElementById('modal-room-title');
      const modalPriceDisplay = document.getElementById('modal-room-price-display');
      const modalTotalPrice = document.getElementById('modal-total-price');
      const confirmSimBtn = document.getElementById('confirm-simulation-btn');
      const conciergeCta = document.getElementById('open-concierge-modal');

      function openModal(title, price) {
        modalTitle.textContent = title;
        modalPriceDisplay.textContent = 'Tarif indicatif : ' + formatMGA(price) + ' / nuitée';
        modal.dataset.pricePerNight = String(price);
        updateModalTotal();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      const dateInputs = Array.from(document.querySelectorAll('#booking-modal input[type="date"]'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const toISO = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const arrivalDefault = new Date(today);
      arrivalDefault.setDate(arrivalDefault.getDate() + 30);
      const departureDefault = new Date(arrivalDefault);
      departureDefault.setDate(departureDefault.getDate() + 5);
      if (dateInputs[0] && dateInputs[1]) {
        dateInputs[0].min = toISO(today);
        dateInputs[0].value = toISO(arrivalDefault);
        dateInputs[1].min = toISO(departureDefault);
        dateInputs[1].value = toISO(departureDefault);
      }
      const updateModalTotal = () => {
        if (!dateInputs[0] || !dateInputs[1] || !modalTotalPrice) return;
        const start = new Date(`${dateInputs[0].value}T12:00:00`);
        const end = new Date(`${dateInputs[1].value}T12:00:00`);
        const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
        const price = Number(modal.dataset.pricePerNight || 300);
        modalTotalPrice.textContent = `${formatAr(toMGA(price) * nights)} (séjour ${nights} nuit${nights > 1 ? 's' : ''})`;
      };
      dateInputs[0]?.addEventListener('change', () => {
        dateInputs[0].setCustomValidity('');
        const next = new Date(`${dateInputs[0].value}T12:00:00`);
        next.setDate(next.getDate() + 1);
        dateInputs[1].min = toISO(next);
        if (dateInputs[1].value <= dateInputs[0].value) dateInputs[1].value = toISO(next);
        dateInputs[1].setCustomValidity('');
        updateModalTotal();
      });
      dateInputs[1]?.addEventListener('change', () => {
        dateInputs[1].setCustomValidity(dateInputs[1].value > dateInputs[0].value ? '' : 'La date de départ doit être postérieure à la date d’arrivée.');
        updateModalTotal();
      });

      simButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const title = btn.getAttribute('data-room-title');
          const price = parseInt(btn.getAttribute('data-room-price') || '300');
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
        const form = document.getElementById('simulation-form');
        if (dateInputs[0] && dateInputs[1]) {
          dateInputs[1].setCustomValidity(dateInputs[1].value > dateInputs[0].value ? '' : 'La date de départ doit être postérieure à la date d’arrivée.');
        }
        if (!form.reportValidity()) return;
        const notif = document.getElementById('notification-container');
        if (notif) {
          const toast = document.createElement('div');
          toast.className = 'bg-espresso-dark text-pale-vanilla px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-opacity duration-300 pointer-events-auto border border-warm-border/30';
          toast.setAttribute('role', 'status');
          toast.innerHTML = '<span class="material-symbols-outlined text-sun-gold text-[20px]">check_circle</span><span class="font-label-md text-[13px]">Votre demande de démonstration a été validée. Aucune réservation réelle n’a été créée et aucune donnée n’a été transmise.</span>';
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
