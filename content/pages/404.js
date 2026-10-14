function switchLegalTab(tabId) {
    const tabs = ['mentions', 'confidentialite', 'cookies', 'cgu'];
    tabs.forEach(t => {
      const btn = document.getElementById('tab-' + t);
      const panel = document.getElementById('panel-' + t);
      if (t === tabId) {
        btn.classList.remove('text-secondary');
        btn.classList.add('bg-espresso-dark', 'text-pale-vanilla', 'shadow-sm');
        panel.classList.remove('hidden');
        panel.classList.add('flex');
      } else {
        btn.classList.remove('bg-espresso-dark', 'text-pale-vanilla', 'shadow-sm');
        btn.classList.add('text-secondary');
        panel.classList.add('hidden');
        panel.classList.remove('flex');
      }
    });
  }

  function toggleAccordion(id) {
    const body = document.getElementById('body-' + id);
    const icon = document.getElementById('icon-' + id);
    if (!body || !icon) return;

    const isHidden = body.classList.contains('hidden');
    if (isHidden) {
      body.classList.remove('hidden');
      icon.innerHTML = '<span class="material-symbols-outlined text-[20px]">remove</span>';
      icon.classList.add('rotate-180');
    } else {
      body.classList.add('hidden');
      icon.innerHTML = '<span class="material-symbols-outlined text-[20px]">add</span>';
      icon.classList.remove('rotate-180');
    }
  }

  function showAuditNotice() {
    const toast = document.createElement('div');
    toast.className = 'px-space-lg py-3 rounded-full bg-espresso-dark text-pale-vanilla font-label-md text-label-sm shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto';
    toast.innerHTML = '<span class="material-symbols-outlined text-sun-gold text-[18px]">info</span><span>Informations et certifications à vérifier avant publication réelle.</span>';
    
    const container = document.getElementById('notification-container');
    if (container) {
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      }, 50);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    }
  }
