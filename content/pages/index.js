document.addEventListener('DOMContentLoaded', function () {
  window.toggleHomeFaq = function (button) {
    const card = button.closest('.faq-card');
    if (!card) return;
    const container = card.closest('#resort-faq') || document.getElementById('resort-faq');
    const wasOpen = card.getAttribute('data-open') === 'true';

    if (container) {
      container.querySelectorAll('.faq-card').forEach(function (otherCard) {
        if (otherCard !== card) {
          otherCard.setAttribute('data-open', 'false');
          const otherBtn = otherCard.querySelector('.faq-btn');
          const otherContent = otherCard.querySelector('.faq-content');
          const otherIcon = otherCard.querySelector('.faq-icon');
          const otherSpan = otherIcon ? otherIcon.querySelector('.material-symbols-outlined') : null;

          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.classList.add('hidden');
          if (otherIcon) {
            otherIcon.className =
              'faq-icon w-8 h-8 rounded-full bg-soft-sand border border-warm-border text-espresso-dark flex items-center justify-center flex-shrink-0 transition-colors';
          }
          if (otherSpan) otherSpan.textContent = 'expand_more';
        }
      });
    }

    const content = card.querySelector('.faq-content');
    const icon = card.querySelector('.faq-icon');
    const iconSpan = icon ? icon.querySelector('.material-symbols-outlined') : null;

    if (wasOpen) {
      card.setAttribute('data-open', 'false');
      button.setAttribute('aria-expanded', 'false');
      if (content) content.classList.add('hidden');
      if (icon) {
        icon.className =
          'faq-icon w-8 h-8 rounded-full bg-soft-sand border border-warm-border text-espresso-dark flex items-center justify-center flex-shrink-0 transition-colors';
      }
      if (iconSpan) iconSpan.textContent = 'expand_more';
    } else {
      card.setAttribute('data-open', 'true');
      button.setAttribute('aria-expanded', 'true');
      if (content) content.classList.remove('hidden');
      if (icon) {
        icon.className =
          'faq-icon w-8 h-8 rounded-full bg-espresso-dark text-[#FFFBF2] flex items-center justify-center flex-shrink-0 transition-colors';
      }
      if (iconSpan) iconSpan.textContent = 'expand_less';
    }
  };
});
