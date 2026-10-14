(function() {
      const SUITE_RATES = {
        'dunes': { name: 'Villa Dunes', price: 280, tagline: 'Vue panoramique mer d’émeraude' },
        'baie': { name: 'Suite Baie d’Or', price: 450, tagline: 'Lagon turquoise & terrasse en teck' },
        'emeraude': { name: 'Pavillon Royal', price: 790, tagline: 'Piscine à débordement privée & service majordome' }
      };
      const DISPLAY_MGA_PER_EUR = 5085 / 25;
      const toMGA = (amountInEuros) => Math.round(amountInEuros * DISPLAY_MGA_PER_EUR / 100) * 100;
      const roundMGA = (amountInMGA) => Math.round(amountInMGA / 100) * 100;
      const formatAr = (amountInMGA) => `${amountInMGA.toLocaleString('fr-FR')} Ar`;

      let adults = 2;
      let children = 0;

      window.adjustGuests = function(type, delta) {
        if (type === 'adults') {
          adults = Math.max(1, Math.min(8, adults + delta));
          document.getElementById('count-adults').textContent = adults;
        } else {
          children = Math.max(0, Math.min(6, children + delta));
          document.getElementById('count-children').textContent = children;
        }
        window.updateCalculation();
      };

      window.updateCalculation = function() {
        const arrivalVal = document.getElementById('date-arrival').value;
        const departureVal = document.getElementById('date-departure').value;
        
        let nights = 4;
        if (arrivalVal && departureVal) {
          const d1 = new Date(arrivalVal);
          const d2 = new Date(departureVal);
          const diffTime = d2 - d1;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          nights = diffDays > 0 ? diffDays : 1;
        }

        const selectedSuite = document.querySelector('input[name="suite"]:checked').value;
        const suiteInfo = SUITE_RATES[selectedSuite];
        document.getElementById('suite-tagline').textContent = suiteInfo.tagline;

        const roomSubtotal = toMGA(suiteInfo.price) * nights;
        let total = roomSubtotal;

        const hasTransfer = document.getElementById('opt-transfer').checked;
        const hasDining = document.getElementById('opt-dining').checked;
        const hasSeaTrip = document.getElementById('opt-sea').checked;

        if (hasTransfer) total += toMGA(75);
        if (hasDining) total += (toMGA(45) * adults * nights);
        if (hasSeaTrip) total += (toMGA(120) * (adults + children));
        total += roundMGA(total * 0.05);

        const formattedTotal = formatAr(total);
        document.getElementById('total-price-display').textContent = formattedTotal;
        document.getElementById('summary-nights').textContent = nights + (nights > 1 ? ' nuits' : ' nuit');
        document.getElementById('summary-guests').textContent = adults + (adults > 1 ? ' adultes' : ' adulte') + (children > 0 ? (', ' + children + ' enfant' + (children > 1 ? 's' : '')) : '');

        return {
          total: formattedTotal,
          nights: nights,
          suiteName: suiteInfo.name
        };
      };

      window.simulateBooking = function() {
        const arrivalInput = document.getElementById('date-arrival');
        const departureInput = document.getElementById('date-departure');
        departureInput.setCustomValidity(departureInput.value > arrivalInput.value ? '' : 'La date de départ doit être postérieure à la date d’arrivée.');
        if (!arrivalInput.reportValidity() || !departureInput.reportValidity()) return;
        const calc = window.updateCalculation();
        document.getElementById('modal-suite-name').textContent = calc.suiteName;
        
        const d1 = document.getElementById('date-arrival').value;
        const d2 = document.getElementById('date-departure').value;
        document.getElementById('modal-dates').textContent = 'Du ' + d1 + ' au ' + d2 + ' (' + calc.nights + ' nuits)';
        document.getElementById('modal-guests').textContent = adults + ' adultes, ' + children + ' enfant(s)';
        document.getElementById('modal-total-price').textContent = calc.total;

        const modal = document.getElementById('confirmation-modal');
        const card = document.getElementById('modal-card');
        modal.classList.remove('hidden');
        setTimeout(() => {
          modal.classList.remove('opacity-0');
          card.classList.remove('scale-95');
          card.classList.add('scale-100');
        }, 10);
      };

      window.closeModal = function() {
        const modal = document.getElementById('confirmation-modal');
        const card = document.getElementById('modal-card');
        modal.classList.add('opacity-0');
        card.classList.remove('scale-100');
        card.classList.add('scale-95');
        setTimeout(() => {
          modal.classList.add('hidden');
        }, 300);
      };

      window.sendContactMessage = function() {
        const form = document.getElementById('contact-form');
        if (!form.reportValidity()) return;
        const feedback = document.getElementById('contact-form-feedback');
        if (feedback) {
          feedback.textContent = 'Votre formulaire de démonstration a été validé. Aucun message n’a été envoyé et aucune donnée n’a été transmise.';
          feedback.classList.remove('hidden');
        }
        form.reset();
      };

      const contactForm = document.getElementById('contact-form');
      const contactFeedback = document.getElementById('contact-form-feedback');
      contactForm?.addEventListener('input', () => contactFeedback?.classList.add('hidden'));

      const bookingTab = document.getElementById('tab-btn-booking');
      const contactTab = document.getElementById('tab-btn-contact');
      const bookingBox = document.getElementById('booking-container');
      const contactBox = document.getElementById('contact-container');

      window.switchTab = function(mode) {
        if (mode === 'booking') {
          bookingTab.className = "flex-1 py-2.5 px-space-md rounded-full font-label-md text-label-md text-center transition-all bg-espresso-dark text-[#FFFBF2] font-semibold shadow-sm flex items-center justify-center gap-2";
          contactTab.className = "flex-1 py-2.5 px-space-md rounded-full font-label-md text-label-md text-center transition-all text-secondary hover:text-espresso-dark flex items-center justify-center gap-2";
          bookingBox.classList.remove('hidden');
          contactBox.classList.add('hidden');
        } else {
          contactTab.className = "flex-1 py-2.5 px-space-md rounded-full font-label-md text-label-md text-center transition-all bg-espresso-dark text-[#FFFBF2] font-semibold shadow-sm flex items-center justify-center gap-2";
          bookingTab.className = "flex-1 py-2.5 px-space-md rounded-full font-label-md text-label-md text-center transition-all text-secondary hover:text-espresso-dark flex items-center justify-center gap-2";
          bookingBox.classList.add('hidden');
          contactBox.classList.remove('hidden');
        }
      };

      bookingTab.addEventListener('click', () => window.switchTab('booking'));
      contactTab.addEventListener('click', () => window.switchTab('contact'));

      window.toggleFaq = function(button) {
        const card = button.closest('.faq-card');
        const isOpen = card.getAttribute('data-open') === 'true';
        const content = card.querySelector('.faq-content');
        const iconSpan = card.querySelector('.faq-icon span');
        const iconBox = card.querySelector('.faq-icon');

        if (isOpen) {
          content.classList.add('hidden');
          card.setAttribute('data-open', 'false');
          iconSpan.textContent = 'expand_more';
          iconBox.classList.remove('bg-espresso-dark', 'text-[#FFFBF2]');
          iconBox.classList.add('bg-soft-sand', 'text-espresso-dark');
        } else {
          content.classList.remove('hidden');
          card.setAttribute('data-open', 'true');
          iconSpan.textContent = 'expand_less';
          iconBox.classList.remove('bg-soft-sand', 'text-espresso-dark');
          iconBox.classList.add('bg-espresso-dark', 'text-[#FFFBF2]');
        }
      };

      const today = new Date();
      const arrival = new Date(today);
      arrival.setDate(today.getDate() + 30);
      const departure = new Date(arrival);
      departure.setDate(arrival.getDate() + 4);
      const toISO = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const arrivalInput = document.getElementById('date-arrival');
      const departureInput = document.getElementById('date-departure');
      arrivalInput.min = toISO(today);
      arrivalInput.value = toISO(arrival);
      departureInput.min = toISO(new Date(arrival.getTime() + 86400000));
      departureInput.value = toISO(departure);
      arrivalInput.addEventListener('change', () => {
        const minDeparture = new Date(`${arrivalInput.value}T12:00:00`);
        minDeparture.setDate(minDeparture.getDate() + 1);
        departureInput.min = toISO(minDeparture);
        if (departureInput.value <= arrivalInput.value) departureInput.value = toISO(minDeparture);
        departureInput.setCustomValidity('');
        window.updateCalculation();
      });
      departureInput.addEventListener('change', () => {
        departureInput.setCustomValidity(departureInput.value > arrivalInput.value ? '' : 'La date de départ doit être postérieure à la date d’arrivée.');
        window.updateCalculation();
      });
      window.updateCalculation();
    })();
