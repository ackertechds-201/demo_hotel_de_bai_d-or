(function initSuiteDetailInteractions() {
    // --- Dynamic Total Price Calculation ---
    const checkinInput = document.getElementById('input-checkin');
    const checkoutInput = document.getElementById('input-checkout');
    const guestCountEl = document.getElementById('guest-count');
    const guestLabelEl = document.getElementById('guests-label');
    const guestPlusBtn = document.getElementById('guest-plus');
    const guestMinusBtn = document.getElementById('guest-minus');
    const extraCheckboxes = document.querySelectorAll('.extra-checkbox');
    
    const labelNightsEl = document.getElementById('label-nights');
    const priceSubtotalEl = document.getElementById('price-subtotal');
    const priceTaxesEl = document.getElementById('price-taxes');
    const priceExtrasEl = document.getElementById('price-extras');
    const extrasRowEl = document.getElementById('extras-summary-row');
    const priceTotalEl = document.getElementById('price-total');
    
    const PRICE_PER_NIGHT = 320;
    const DISPLAY_MGA_PER_EUR = 5085 / 25;
    const formatMGA = (amountInEuros) => `${(Math.round(amountInEuros * DISPLAY_MGA_PER_EUR / 100) * 100).toLocaleString('fr-FR')} Ar`;
    let guestCount = 2;

    function calculateNights() {
      if (!checkinInput || !checkoutInput) return 4;
      const start = new Date(checkinInput.value);
      const end = new Date(checkoutInput.value);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }

    function updateBreakdown() {
      const nights = calculateNights();
      const subtotal = nights * PRICE_PER_NIGHT;
      const taxes = Math.round(subtotal * 0.05);

      let extrasTotal = 0;
      extraCheckboxes.forEach(cb => {
        if (cb.checked) {
          extrasTotal += parseInt(cb.getAttribute('data-price') || '0', 10);
        }
      });

      if (labelNightsEl) labelNightsEl.textContent = `${formatMGA(PRICE_PER_NIGHT)} x ${nights} nuit${nights > 1 ? 's' : ''}`;
      if (priceSubtotalEl) priceSubtotalEl.textContent = formatMGA(subtotal);
      if (priceTaxesEl) priceTaxesEl.textContent = formatMGA(taxes);

      if (extrasTotal > 0) {
        if (extrasRowEl) extrasRowEl.classList.remove('hidden');
        if (extrasRowEl) extrasRowEl.classList.add('flex');
        if (priceExtrasEl) priceExtrasEl.textContent = `+${formatMGA(extrasTotal)}`;
      } else {
        if (extrasRowEl) extrasRowEl.classList.add('hidden');
        if (extrasRowEl) extrasRowEl.classList.remove('flex');
      }

      const total = subtotal + taxes + extrasTotal;
      if (priceTotalEl) priceTotalEl.textContent = formatMGA(total);
    }

    if (checkinInput && checkoutInput) {
      checkinInput.addEventListener('change', updateBreakdown);
      checkoutInput.addEventListener('change', updateBreakdown);
    }

    extraCheckboxes.forEach(cb => {
      cb.addEventListener('change', updateBreakdown);
    });

    if (guestPlusBtn && guestMinusBtn && guestCountEl) {
      guestPlusBtn.addEventListener('click', () => {
        if (guestCount < 3) {
          guestCount++;
          guestCountEl.textContent = guestCount;
          guestLabelEl.textContent = `${guestCount} voyageurs`;
          guestMinusBtn.disabled = false;
          if (guestCount === 3) guestPlusBtn.disabled = true;
        }
      });

      guestMinusBtn.addEventListener('click', () => {
        if (guestCount > 1) {
          guestCount--;
          guestCountEl.textContent = guestCount;
          guestLabelEl.textContent = `${guestCount} voyageur${guestCount > 1 ? 's' : ''}`;
          guestPlusBtn.disabled = false;
          if (guestCount === 1) guestMinusBtn.disabled = true;
        }
      });
    }

    // --- Interactive Modal for Photo Gallery ---
    const openGalleryBtn = document.getElementById('open-gallery-modal');
    const closeGalleryBtn = document.getElementById('close-gallery-modal');
    const galleryModal = document.getElementById('gallery-modal');

    if (openGalleryBtn && galleryModal) {
      openGalleryBtn.addEventListener('click', () => {
        galleryModal.classList.remove('hidden');
        galleryModal.classList.add('flex');
      });
    }

    if (closeGalleryBtn && galleryModal) {
      closeGalleryBtn.addEventListener('click', () => {
        galleryModal.classList.add('hidden');
        galleryModal.classList.remove('flex');
      });
    }

    if (galleryModal) {
      galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
          galleryModal.classList.add('hidden');
          galleryModal.classList.remove('flex');
        }
      });
    }

    // --- Favorite Toggle Micro-interaction ---
    const btnFavorite = document.getElementById('btn-favorite');
    const favIcon = document.getElementById('fav-icon');
    let isFav = false;
    if (btnFavorite && favIcon) {
      btnFavorite.addEventListener('click', () => {
        isFav = !isFav;
        if (isFav) {
          favIcon.textContent = 'favorite';
          favIcon.classList.remove('text-[#6f5a4f]');
          favIcon.classList.add('text-error');
          favIcon.style.fontVariationSettings = "'FILL' 1";
        } else {
          favIcon.textContent = 'favorite_border';
          favIcon.classList.remove('text-error');
          favIcon.classList.add('text-[#6f5a4f]');
          favIcon.style.fontVariationSettings = "'FILL' 0";
        }
      });
    }

    // --- Simulation Toast Trigger ---
    const simulateBtn = document.getElementById('btn-simulate-booking');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', () => {
        const notifContainer = document.getElementById('notification-container');
        if (!notifContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'bg-[#1F1610] text-[#FFFBF2] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md pointer-events-auto border border-[#E5A93C]/30';
        toast.innerHTML = `
          <span class="material-symbols-outlined text-[#E5A93C] text-[22px]">check_circle</span>
          <div class="flex flex-col">
            <span class="text-[13px] font-bold text-[#FFFBF2]">Simulation enregistrée avec succès</span>
            <span class="text-[12px] opacity-80">Environnement fictif de démonstration - Aucune transaction réelle.</span>
          </div>
        `;
        notifContainer.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, 4000);
      });
    }
    
    // Initial run
    updateBreakdown();
  })();
