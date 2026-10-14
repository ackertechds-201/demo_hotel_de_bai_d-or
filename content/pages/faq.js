document.addEventListener('DOMContentLoaded', function () {
    // 1. Accordion Toggling
    const accordions = document.querySelectorAll('.faq-item');
    accordions.forEach((item) => {
      const toggle = item.querySelector('.faq-toggle');
      const content = item.querySelector('.faq-content');
      const icon = item.querySelector('.faq-icon');

      if (toggle && content) {
        toggle.addEventListener('click', () => {
          const isOpen = !content.classList.contains('hidden');
          
          // Close others in same category for a polished accordion feeling
          const parentGroup = item.closest('.faq-category-group');
          if (parentGroup) {
            parentGroup.querySelectorAll('.faq-item').forEach(other => {
              if (other !== item) {
                const otherContent = other.querySelector('.faq-content');
                const otherIcon = other.querySelector('.faq-icon');
                if (otherContent) otherContent.classList.add('hidden');
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
              }
            });
          }

          if (isOpen) {
            content.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
          } else {
            content.classList.remove('hidden');
            if (icon) icon.style.transform = 'rotate(180deg)';
          }
        });
      }
    });

    // 2. Category Pill Filter Logic
    const filterButtons = document.querySelectorAll('.faq-pill-btn');
    const categoryGroups = document.querySelectorAll('.faq-category-group');
    const searchInput = document.getElementById('faq-search-input');
    const emptyState = document.getElementById('faq-empty-state');

    function applyFilter(filter) {
      filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
          btn.classList.add('bg-espresso-dark', 'text-pale-vanilla');
          btn.classList.remove('bg-surface', 'text-secondary');
        } else {
          btn.classList.remove('bg-espresso-dark', 'text-pale-vanilla');
          btn.classList.add('bg-surface', 'text-secondary');
        }
      });

      let visibleCount = 0;
      categoryGroups.forEach(group => {
        const groupCat = group.getAttribute('data-category');
        const items = group.querySelectorAll('.faq-item');

        if (filter === 'all' || groupCat === filter) {
          group.classList.remove('hidden');
          items.forEach(it => {
            it.classList.remove('hidden');
            visibleCount++;
          });
        } else {
          // Check if any individual item matches (e.g. dining or ecology inside stay)
          let hasMatchingChild = false;
          items.forEach(it => {
            const itemCat = it.getAttribute('data-category');
            if (itemCat === filter) {
              it.classList.remove('hidden');
              hasMatchingChild = true;
              visibleCount++;
            } else {
              it.classList.add('hidden');
            }
          });

          if (hasMatchingChild) {
            group.classList.remove('hidden');
          } else {
            group.classList.add('hidden');
          }
        }
      });

      if (emptyState) {
        if (visibleCount === 0) {
          emptyState.classList.remove('hidden');
        } else {
          emptyState.classList.add('hidden');
        }
      }
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        applyFilter(filter);
        if (searchInput) searchInput.value = '';
      });
    });

    // 3. Search Field Logic
    function performSearch(term) {
      const q = term.toLowerCase().trim();
      let totalFound = 0;

      // Reset pill states to 'all' visually
      filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === 'all') {
          btn.classList.add('bg-espresso-dark', 'text-pale-vanilla');
          btn.classList.remove('bg-surface', 'text-secondary');
        } else {
          btn.classList.remove('bg-espresso-dark', 'text-pale-vanilla');
          btn.classList.add('bg-surface', 'text-secondary');
        }
      });

      categoryGroups.forEach(group => {
        let groupHasMatch = false;
        const items = group.querySelectorAll('.faq-item');

        items.forEach(item => {
          const text = (item.textContent || '').toLowerCase();
          const keywords = (item.getAttribute('data-keywords') || '').toLowerCase();
          
          if (!q || text.includes(q) || keywords.includes(q)) {
            item.classList.remove('hidden');
            groupHasMatch = true;
            totalFound++;
          } else {
            item.classList.add('hidden');
          }
        });

        if (groupHasMatch) {
          group.classList.remove('hidden');
        } else {
          group.classList.add('hidden');
        }
      });

      if (emptyState) {
        if (totalFound === 0) {
          emptyState.classList.remove('hidden');
        } else {
          emptyState.classList.add('hidden');
        }
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
      });
    }

    const searchBtn = document.getElementById('faq-search-btn');
    function scrollToSearchResults() {
      const firstResult = Array.from(document.querySelectorAll('.faq-item')).find(item => !item.classList.contains('hidden'));
      const target = firstResult || document.getElementById('faq-empty-state') || document.getElementById('faq-filter-container');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
        scrollToSearchResults();
      });
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          performSearch(searchInput.value);
          scrollToSearchResults();
        }
      });
    }

    // Quick chip buttons
    const quickChips = document.querySelectorAll('.quick-chip');
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const term = chip.getAttribute('data-term') || '';
        if (searchInput) {
          searchInput.value = term;
          performSearch(term);
          scrollToSearchResults();
        }
      });
    });

    // Reset button in empty state
    const resetBtn = document.getElementById('reset-search-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        applyFilter('all');
      });
    }
  });
