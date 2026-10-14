  function filterCategory(cat) {
    const cards = document.querySelectorAll('.exp-card');
    const pills = document.querySelectorAll('.pill-btn');

    pills.forEach(btn => {
      const active = btn.getAttribute('data-category') === cat;
      if (active) {
        btn.className = "pill-btn px-space-lg py-space-xs rounded-full font-label-md text-label-md bg-espresso-dark text-surface-bright transition-all shadow-[0_4px_14px_rgba(38,26,19,0.15)] flex items-center gap-space-xs cursor-pointer border border-espresso-dark";
      } else {
        btn.className = "pill-btn px-space-lg py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-soft-sand transition-all flex items-center gap-space-xs cursor-pointer border border-warm-border";
      }
    });

    cards.forEach(card => {
      if (cat === 'all' || card.getAttribute('data-exp-type') === cat) {
        card.style.display = 'grid';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function prefillBooking(expName) {
    const select = document.getElementById('exp-select');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text.includes(expName) || expName.includes(select.options[i].value)) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
    const planner = document.getElementById('planificateur');
    if (planner) {
      planner.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleExperienceSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('experience-simulation-form');
    const dateInput = document.getElementById('exp-date');
    if (!form.reportValidity()) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(`${dateInput.value}T12:00:00`);
    dateInput.setCustomValidity(selectedDate >= today ? '' : 'Choisissez une date qui n’est pas passée.');
    if (!dateInput.reportValidity()) return;
    const feedbackBox = document.getElementById('simulation-feedback');
    const feedbackText = document.getElementById('simulation-feedback-text');

    if (feedbackBox && feedbackText) {
      feedbackText.textContent = 'Votre formulaire de démonstration a été validé. Aucun message n’a été envoyé et aucune donnée n’a été transmise.';
      feedbackBox.classList.remove('hidden');
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      form.reset();
    }
  }

  const experienceDate = document.getElementById('exp-date');
  const experienceForm = document.getElementById('experience-simulation-form');
  const experienceFeedback = document.getElementById('simulation-feedback');
  experienceForm?.addEventListener('input', () => experienceFeedback?.classList.add('hidden'));
  if (experienceDate) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    experienceDate.min = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
    experienceDate.value = experienceDate.min;
    experienceDate.addEventListener('change', () => experienceDate.setCustomValidity(''));
  }

  let currentSlide = 0;
  const totalSlides = 3;

  function updateTestimonialDisplay() {
    for (let i = 0; i < totalSlides; i++) {
      const slide = document.getElementById('slide-' + i);
      if (slide) {
        if (i === currentSlide) {
          slide.classList.remove('hidden');
          slide.classList.add('flex');
          setTimeout(() => {
            slide.classList.remove('opacity-0');
            slide.classList.add('opacity-100');
          }, 20);
        } else {
          slide.classList.add('hidden');
          slide.classList.remove('flex');
          slide.classList.add('opacity-0');
          slide.classList.remove('opacity-100');
        }
      }
    }
    const counter = document.getElementById('testimonial-counter');
    if (counter) {
      counter.innerText = '0' + (currentSlide + 1) + ' / 0' + totalSlides;
    }
  }

  function nextTestimonial() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateTestimonialDisplay();
  }

  function prevTestimonial() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateTestimonialDisplay();
  }
