function triggerPdfNotice() {
      const container = document.getElementById('notification-container');
      if (!container) return;

      const notif = document.createElement('div');
      notif.className = "pointer-events-auto bg-espresso-dark text-pale-vanilla p-space-md rounded-lg shadow-xl flex items-center gap-space-sm transition-all duration-300 transform translate-y-2 max-w-sm";
      notif.innerHTML = `
        <span class="material-symbols-outlined text-sun-gold text-[24px]">task_alt</span>
        <div class="flex flex-col text-left">
          <span class="font-label-md text-label-sm uppercase font-bold text-sun-gold">Génération Simulée</span>
          <span class="font-body-sm text-body-sm">Bordereau #BD-DIEGO-2025-9481 synthétisé avec succès pour démonstration locale.</span>
        </div>
      `;

      container.appendChild(notif);
      setTimeout(() => {
        notif.classList.remove('translate-y-2');
        notif.classList.add('translate-y-0');
      }, 10);

      setTimeout(() => {
        notif.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => notif.remove(), 400);
      }, 4500);
    }
