  document.addEventListener('DOMContentLoaded', () => {
    const metricCards = document.querySelectorAll('#manifeste, section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
        }
      });
    }, { threshold: 0.1 });

    metricCards.forEach(card => observer.observe(card));
  });
