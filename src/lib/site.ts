/**
 * Shared behaviours layered on top of the exported pages: mobile navigation,
 * the simulated booking flow (suite / rooms / reservation → confirmation) and
 * deep links into the contact and legal tabs.
 */

type Booking = {
  suite: string;
  rate: number;
  arrival: string;
  departure: string;
  nights: number;
  adults: number;
  children: number;
  extras: number;
  extrasLabel: string;
  ref?: string;
  createdAt?: string;
};

type Calculation = { total: string; suiteName: string; nights: number };

declare global {
  interface Window {
    switchTab?: (tab: string) => void;
    switchLegalTab?: (tab: string) => void;
    updateCalculation?: () => Calculation;
  }
}

const STORAGE_KEY = "baiedor:booking-mga";
const DISPLAY_MGA_PER_EUR = 5085 / 25;
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const SUITE_RATES: Record<string, number> = { dunes: 280 * DISPLAY_MGA_PER_EUR, baie: 450 * DISPLAY_MGA_PER_EUR, emeraude: 790 * DISPLAY_MGA_PER_EUR };

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $all = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

const IMAGE_FALLBACKS = {
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2600&q=90",
  resort: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2600&q=90",
  room: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=2600&q=90",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=2600&q=90",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2600&q=90",
  landscape: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2600&q=90",
  portrait: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=90",
  portraitWoman: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=90",
} as const;

function imageFallbackFor(description: string) {
  const text = description.toLocaleLowerCase("fr");
  if (/spa|massage|bien-être|wellness/.test(text)) return IMAGE_FALLBACKS.spa;
  if (/gastronom|cuisine|restaurant|langouste|plat|culinaire|food|dîner|déjeuner/.test(text)) return IMAGE_FALLBACKS.food;
  if (/portrait|concierge|chef |directrice|directeur|voyageur|visage|personne/.test(text)) {
    return /femme|woman|directrice/.test(text) ? IMAGE_FALLBACKS.portraitWoman : IMAGE_FALLBACKS.portrait;
  }
  if (/chambre|suite|lit|bungalow|bedroom|intérieur|interior/.test(text)) return IMAGE_FALLBACKS.room;
  if (/piscine|villa|hôtel|hotel|resort|lodge|pavillon/.test(text)) return IMAGE_FALLBACKS.resort;
  if (/forêt|forest|montagne|tsingy|parc|paysage|landscape/.test(text)) return IMAGE_FALLBACKS.landscape;
  return IMAGE_FALLBACKS.beach;
}

function initImageFallbacks() {
  const recoverImage = (image: HTMLImageElement) => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = "true";
    image.src = imageFallbackFor(image.getAttribute("data-alt") || image.alt || "");
  };

  // Keep working photos as-is; swap only external images that fail to load.
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement) recoverImage(image);
  }, true);

  // React hydrates after the browser has started loading page images. Recover
  // images that already failed before this shared handler was installed.
  $all<HTMLImageElement>("img").forEach((image) => {
    if (image.complete && image.naturalWidth === 0) recoverImage(image);
  });

  // Defer CSS backgrounds until they approach the viewport. Unlike <img>,
  // CSS backgrounds have no native loading="lazy" support.
  const backgrounds = $all<HTMLElement>("[data-lazy-background]");
  const loadBackground = (element: HTMLElement) => {
    if (element.dataset.backgroundLoading) return;
    element.dataset.backgroundLoading = "true";
    const source = element.dataset.lazyBackground;
    if (!source) return;
    const apply = (url: string, isFallback = false) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        element.style.backgroundImage = `url("${url}")`;
      };
      image.onerror = () => {
        if (isFallback || element.dataset.backgroundFallbackApplied) return;
        element.dataset.backgroundFallbackApplied = "true";
        apply(imageFallbackFor(element.getAttribute("data-alt") || element.getAttribute("data-location") || ""), true);
      };
      image.src = url;
    };
    apply(source);
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        loadBackground(element);
      });
    }, { rootMargin: "500px 0px" });
    backgrounds.forEach((element) => observer.observe(element));
  } else {
    backgrounds.forEach(loadBackground);
  }
}

function fieldLabel(control: HTMLInputElement | HTMLSelectElement, fallback?: ParentNode | null) {
  const label = control.labels?.[0] || fallback?.querySelector("label, span:not(.material-symbols-outlined)");
  if (!label) return "";
  const copy = label.cloneNode(true) as Element;
  copy.querySelectorAll(".material-symbols-outlined").forEach((icon) => icon.remove());
  return copy.textContent?.trim() || "";
}

const formatMGA = (n: number) => `${(Math.round(n / 100) * 100).toLocaleString("fr-FR").replace(/\u202f/g, " ")} Ar`;

function frDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d.getTime()) ? iso : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function isoOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(a: string, b: string) {
  const n = Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
  return n > 0 ? n : 1;
}

const parseAmount = (text: string) => parseInt(String(text).replace(/[^\d]/g, ""), 10) || 0;

function placeBookingPopover(popover: HTMLElement, anchor: HTMLElement) {
  const margin = 8;
  popover.style.maxHeight = "";
  const bounds = anchor.getBoundingClientRect();
  const popoverBounds = popover.getBoundingClientRect();
  const spaceBelow = window.innerHeight - bounds.bottom - margin;
  const spaceAbove = bounds.top - margin;
  const openAbove = spaceBelow < popoverBounds.height && spaceAbove > spaceBelow;
  popover.classList.toggle("opens-up", openAbove);
  popover.classList.remove("align-right");
  const safeLeft = Math.max(margin, Math.min(bounds.left, window.innerWidth - popoverBounds.width - margin));
  const offsetParent = popover.offsetParent;
  if (offsetParent instanceof HTMLElement) {
    popover.style.left = `${safeLeft - offsetParent.getBoundingClientRect().left - offsetParent.clientLeft}px`;
    popover.style.right = "auto";
  }
  const availableHeight = (openAbove ? spaceAbove : spaceBelow) - margin;
  popover.style.maxHeight = `${Math.max(96, availableHeight)}px`;
}

function saveBooking(b: Booking) {
  b.ref = `BD-DIEGO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  b.createdAt = new Date().toISOString();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

const goTo = (href: string, delay = 0) => setTimeout(() => (window.location.href = href), delay);

function initSharedFormControls() {
  $all<HTMLSelectElement>("select").forEach((select) => {
    if (select.dataset.enhanced || select.multiple || select.size > 1) return;
    const host = select.parentElement;
    if (!host) return;
    const selectStyleClasses = select.className;
    select.dataset.enhanced = "true";
    host.classList.add("booking-select-host");
    select.classList.add("booking-select-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = `booking-select-trigger site-select-trigger ${selectStyleClasses}`;
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const label = fieldLabel(select, select.parentElement) || fieldLabel(select, select.parentElement?.parentElement);
    if (label) trigger.setAttribute("aria-label", label);
    const value = document.createElement("span");
    value.className = "site-select-value";
    const syncValue = () => (value.textContent = select.selectedOptions[0]?.textContent?.trim() || "Choisir");
    syncValue();
    select.addEventListener("change", syncValue);
    const chevron = document.createElement("span");
    chevron.className = "booking-select-chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.append(value, chevron);

    const menu = document.createElement("div");
    menu.className = "booking-select-menu hidden";
    menu.setAttribute("role", "listbox");
    if (label) menu.setAttribute("aria-label", label);
    const options = Array.from(select.options).map((option, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "booking-select-option";
      item.textContent = option.textContent?.trim() || "";
      item.disabled = option.disabled;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.addEventListener("click", () => {
        select.selectedIndex = index;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      });
      menu.append(item);
      return item;
    });
    select.addEventListener("change", () => {
      menu.querySelectorAll("[aria-selected='true']").forEach((el) => el.setAttribute("aria-selected", "false"));
      options[select.selectedIndex]?.setAttribute("aria-selected", "true");
    });
    trigger.addEventListener("click", () => {
      const opening = menu.classList.contains("hidden");
      document.querySelectorAll(".booking-select-menu, .booking-calendar").forEach((el) => el.classList.add("hidden"));
      const expanded = document.querySelectorAll(".booking-select-trigger[aria-expanded='true']");
      expanded.forEach((el) => el.setAttribute("aria-expanded", "false"));
      menu.classList.toggle("hidden", !opening);
      trigger.setAttribute("aria-expanded", String(opening));
      if (opening) {
        placeBookingPopover(menu, trigger);
        options[select.selectedIndex]?.focus();
      }
    });
    trigger.addEventListener("keydown", (event) => {
      if (["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        menu.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
        placeBookingPopover(menu, trigger);
        options[select.selectedIndex]?.focus();
      }
    });
    menu.addEventListener("keydown", (event) => {
      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "Escape") {
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        options[(current + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length]?.focus();
      }
    });
    host.append(trigger, menu);
  });

  $all<HTMLInputElement>('input[type="date"]:not([data-enhanced])').forEach((input) => {
    const host = input.parentElement;
    if (!host) return;
    const dateStyleClasses = input.className;
    input.dataset.enhanced = "true";
    input.classList.add("site-date-native");
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    host.classList.add("site-date-host");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = `site-date-trigger ${dateStyleClasses}`;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    const value = document.createElement("span");
    value.className = "site-date-value";
    const label = fieldLabel(input, host);
    if (label) trigger.setAttribute("aria-label", label);
    const icon = document.createElement("span");
    icon.className = "site-date-icon";
    icon.setAttribute("aria-hidden", "true");
    trigger.append(value, icon);
    const format = (date: string) =>
      date ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Choisir une date";
    const syncValue = () => {
      value.textContent = format(input.value);
      if (label) trigger.setAttribute("aria-label", `${label} : ${value.textContent}`);
    };
    syncValue();

    const calendar = document.createElement("div");
    calendar.className = "booking-calendar site-date-calendar hidden";
    calendar.setAttribute("role", "dialog");
    calendar.setAttribute("aria-label", input.labels?.[0]?.textContent?.trim() || "Choisir une date");
    calendar.innerHTML = '<div class="booking-calendar-heading"><button type="button" data-calendar-shift="-1" aria-label="Mois précédent">‹</button><strong></strong><button type="button" data-calendar-shift="1" aria-label="Mois suivant">›</button></div><div class="booking-calendar-weekdays"><span>Lu</span><span>Ma</span><span>Me</span><span>Je</span><span>Ve</span><span>Sa</span><span>Di</span></div><div class="booking-calendar-days"></div>';
    let view = input.value ? new Date(`${input.value}T12:00:00`) : new Date();
    view = new Date(view.getFullYear(), view.getMonth(), 1);
    const toISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const renderCalendar = () => {
      const heading = $<HTMLElement>(".booking-calendar-heading strong", calendar);
      const days = $<HTMLElement>(".booking-calendar-days", calendar);
      if (!heading || !days) return;
      heading.textContent = view.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      days.replaceChildren();
      const offset = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
      const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let i = 0; i < offset; i++) days.append(document.createElement("span"));
      for (let day = 1; day <= total; day++) {
        const date = new Date(view.getFullYear(), view.getMonth(), day);
        const iso = toISO(date);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(day);
        button.className = "booking-calendar-day";
        if (input.min && iso < input.min) button.disabled = true;
        if (input.max && iso > input.max) button.disabled = true;
        if (iso === input.value) button.classList.add("is-selected");
        button.addEventListener("click", () => {
          input.value = iso;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          syncValue();
          calendar.classList.add("hidden");
          trigger.setAttribute("aria-expanded", "false");
        });
        days.append(button);
      }
    };
    renderCalendar();
    input.addEventListener("input", syncValue);
    input.addEventListener("change", syncValue);
    trigger.addEventListener("click", () => {
      document.querySelectorAll(".booking-select-menu, .booking-calendar").forEach((el) => el.classList.add("hidden"));
      view = input.value ? new Date(`${input.value}T12:00:00`) : new Date();
      view = new Date(view.getFullYear(), view.getMonth(), 1);
      renderCalendar();
      calendar.classList.remove("hidden");
      placeBookingPopover(calendar, trigger);
      trigger.setAttribute("aria-expanded", "true");
    });
    calendar.querySelectorAll<HTMLButtonElement>("[data-calendar-shift]").forEach((button) =>
      button.addEventListener("click", () => {
        view = new Date(view.getFullYear(), view.getMonth() + Number(button.dataset.calendarShift), 1);
        renderCalendar();
      }),
    );
    calendar.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        calendar.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
    host.append(trigger, calendar);
  });

  document.addEventListener("reset", (event) => {
    const form = event.target as HTMLFormElement;
    window.setTimeout(() => {
      $all<HTMLSelectElement>("select[data-enhanced='true']", form).forEach((select) =>
        select.dispatchEvent(new Event("change", { bubbles: true })),
      );
      $all<HTMLInputElement>("input[type='date'][data-enhanced='true']", form).forEach((input) => {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }, 0);
  });

  document.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target.closest(".booking-select-host, .site-date-host, #booking-dates-trigger, #booking-dates-popover")) return;
    document.querySelectorAll(".booking-select-menu, .booking-calendar").forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".booking-select-trigger[aria-expanded='true'], .site-date-trigger[aria-expanded='true']").forEach((el) => el.setAttribute("aria-expanded", "false"));
    $("#booking-dates-trigger")?.setAttribute("aria-expanded", "false");
  });

  const repositionOpenPopovers = () => {
    document.querySelectorAll<HTMLElement>(".booking-select-menu:not(.hidden), .booking-calendar:not(.hidden)").forEach((popover) => {
      const anchor = popover.previousElementSibling;
      if (anchor instanceof HTMLElement) placeBookingPopover(popover, anchor);
    });
  };
  window.addEventListener("resize", repositionOpenPopovers);
  window.addEventListener("scroll", repositionOpenPopovers, { passive: true });
}

function initHome() {
  const forms = $all<HTMLFormElement>("form");
  forms[0]?.addEventListener("submit", (event) => {
    event.preventDefault();
    const arrival = $<HTMLInputElement>("#booking-arrival")?.value || "";
    const departure = $<HTMLInputElement>("#booking-departure")?.value || "";
    if (!arrival || !departure) {
      $<HTMLButtonElement>("#booking-dates-trigger")?.click();
      return;
    }
    const params = new URLSearchParams({ arrival, departure });
    goTo(`/chambres?${params.toString()}`);
  });
  forms[1]?.addEventListener("submit", () => goTo("/reservation"));
  const dateTrigger = $<HTMLButtonElement>("#booking-dates-trigger");
  const datePopover = $<HTMLDivElement>("#booking-dates-popover");
  const arrivalInput = $<HTMLInputElement>("#booking-arrival");
  const departureInput = $<HTMLInputElement>("#booking-departure");
  const dateLabel = $("#booking-dates-label");
  if (dateTrigger && datePopover && arrivalInput && departureInput && dateLabel) {
    const today = new Date();
    const arrival = new Date(today);
    arrival.setDate(today.getDate() + 30);
    const departure = new Date(arrival);
    departure.setDate(arrival.getDate() + 7);
    const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let start = iso(arrival);
    let end = iso(departure);
    let view = new Date(arrival.getFullYear(), arrival.getMonth(), 1);
    let selectingDeparture = false;
    const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
    const syncDates = () => {
      arrivalInput.value = start;
      departureInput.value = end;
      dateLabel.textContent = end ? `${formatDate(start)} – ${formatDate(end)}` : `Arrivée ${formatDate(start)} · choisir le départ`;
    };
    const renderCalendar = () => {
      const heading = $<HTMLElement>(".booking-calendar-heading strong", datePopover);
      const days = $<HTMLElement>(".booking-calendar-days", datePopover);
      if (!heading || !days) return;
      heading.textContent = view.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      days.replaceChildren();
      const offset = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
      const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let i = 0; i < offset; i++) days.append(document.createElement("span"));
      for (let day = 1; day <= total; day++) {
        const value = iso(new Date(view.getFullYear(), view.getMonth(), day));
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(day);
        button.className = "booking-calendar-day";
        if (value < iso(today)) button.disabled = true;
        if (value === start || value === end) button.classList.add("is-selected");
        else if (value > start && value < end) button.classList.add("is-in-range");
        button.addEventListener("click", () => {
          if (!selectingDeparture || value <= start) {
            start = value;
            end = "";
            selectingDeparture = true;
            syncDates();
          } else {
            end = value;
            selectingDeparture = false;
            syncDates();
            datePopover.classList.add("hidden");
            dateTrigger.setAttribute("aria-expanded", "false");
          }
          renderCalendar();
        });
        days.append(button);
      }
    };
    syncDates();
    renderCalendar();
    dateTrigger.addEventListener("click", () => {
      document.querySelectorAll(".booking-select-menu").forEach((el) => el.classList.add("hidden"));
      const opening = datePopover.classList.contains("hidden");
      datePopover.classList.toggle("hidden", !opening);
      dateTrigger.setAttribute("aria-expanded", String(opening));
      if (opening) placeBookingPopover(datePopover, dateTrigger);
      renderCalendar();
    });
    datePopover.querySelectorAll<HTMLButtonElement>("[data-calendar-shift]").forEach((button) =>
      button.addEventListener("click", () => {
        view = new Date(view.getFullYear(), view.getMonth() + Number(button.dataset.calendarShift), 1);
        renderCalendar();
      }),
    );
    datePopover.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        datePopover.classList.add("hidden");
        dateTrigger.setAttribute("aria-expanded", "false");
        dateTrigger.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if ((event.target as Element).closest("#booking-dates-trigger, #booking-dates-popover")) return;
      datePopover.classList.add("hidden");
      dateTrigger.setAttribute("aria-expanded", "false");
    });
  }

  $all("#explore .group.flex.flex-col").forEach((card) => {
    card.classList.add("cursor-pointer");
    card.addEventListener("click", () => goTo("/chambres"));
  });
}

function initRooms(params: URLSearchParams) {
  const dates = $all<HTMLInputElement>('#booking-modal input[type="date"]');
  const arrival = params.get("arrival");
  const departure = params.get("departure");
  if (arrival && /^\d{4}-\d{2}-\d{2}$/.test(arrival) && dates[0]) {
    dates[0].value = arrival;
    dates[0].dispatchEvent(new Event("input", { bubbles: true }));
    dates[0].dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (departure && /^\d{4}-\d{2}-\d{2}$/.test(departure) && dates[1]) {
    dates[1].value = departure;
    dates[1].dispatchEvent(new Event("input", { bubbles: true }));
    dates[1].dispatchEvent(new Event("change", { bubbles: true }));
  }
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      const discover = target.closest(".room-card button");
      if (discover && /Découvrir/.test(discover.textContent || "")) {
        e.stopPropagation();
        goTo("/suite");
        return;
      }
      if (target.closest("#confirm-simulation-btn")) {
        e.stopPropagation();
        const title = $("#modal-room-title")?.textContent || "Suite Lagon";
        const priceText = $all("#modal-room-price-display").map((el) => el.textContent).join(" ");
        const rate = parseAmount(priceText) || 320 * DISPLAY_MGA_PER_EUR;
        saveBooking({ suite: title.trim(), rate, arrival: isoOffset(30), departure: isoOffset(35), nights: 5, adults: 2, children: 0, extras: 0, extrasLabel: "" });
        goTo("/confirmation");
      }
    },
    true,
  );
}

function initSuite() {
  const btn = $("#btn-simulate-booking");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const arrival = $<HTMLInputElement>("#input-checkin")?.value || isoOffset(30);
    const departure = $<HTMLInputElement>("#input-checkout")?.value || isoOffset(34);
    const extras = $all<HTMLInputElement>(".extra-checkbox:checked");
    const labels = extras
      .map((c) => (c.closest("label") || c.parentElement)?.querySelector("span, p")?.textContent?.trim() || "")
      .filter(Boolean);
    saveBooking({
      suite: "Suite Lagon • Mer d’Émeraude",
      rate: 320 * DISPLAY_MGA_PER_EUR,
      arrival,
      departure,
      nights: nightsBetween(arrival, departure),
      adults: parseInt($("#guest-count")?.textContent || "", 10) || 2,
      children: 0,
      extras: extras.reduce((s, c) => s + (parseInt(c.dataset.price || "", 10) || 0) * DISPLAY_MGA_PER_EUR, 0),
      extrasLabel: labels.join(" • "),
    });
    goTo("/confirmation", 1200);
  });
}

function initReservation(params: URLSearchParams) {
  if (params.get("tab") === "contact") window.switchTab?.("contact");
  const card = $("#modal-card");
  const actions = card && $all("button", card).find((b) => /Modifier la simulation/.test(b.textContent || ""));
  const row = actions?.parentElement;
  if (!row?.parentElement) return;

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className =
    "w-full py-3.5 px-space-md rounded-full bg-sun-gold text-espresso-dark font-label-md text-label-md font-semibold hover:brightness-95 transition-all flex items-center justify-center gap-2 shadow-md";
  confirm.innerHTML = 'Confirmer et voir mon récapitulatif <span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
  row.parentElement.insertBefore(confirm, row);

  confirm.addEventListener("click", () => {
    const calc = window.updateCalculation?.();
    if (!calc) return;
    const key = $<HTMLInputElement>('input[name="suite"]:checked')?.value || "dunes";
    const rate = SUITE_RATES[key] || 280 * DISPLAY_MGA_PER_EUR;
    const opts = [
      ["opt-transfer", "Transfert VIP Arrachart"],
      ["opt-dining", "Demi-pension gastronomique"],
      ["opt-sea", "Excursion Mer d’Émeraude"],
    ]
      .filter(([id]) => (document.getElementById(id) as HTMLInputElement | null)?.checked)
      .map(([, label]) => label);
    saveBooking({
      suite: calc.suiteName,
      rate,
      arrival: $<HTMLInputElement>("#date-arrival")?.value || isoOffset(30),
      departure: $<HTMLInputElement>("#date-departure")?.value || isoOffset(34),
      nights: calc.nights,
      adults: parseInt($("#count-adults")?.textContent || "", 10) || 2,
      children: parseInt($("#count-children")?.textContent || "", 10) || 0,
      extras: Math.max(0, parseAmount(calc.total) - rate * calc.nights),
      extrasLabel: opts.join(" • "),
    });
    goTo("/confirmation");
  });
}

function initLegal(params: URLSearchParams) {
  const tab = params.get("tab");
  if (tab && document.getElementById(`tab-${tab}`)) window.switchLegalTab?.(tab);
}

function initConfirmation() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  let b: Booking;
  try {
    b = JSON.parse(raw);
  } catch {
    return;
  }

  const ref = b.ref || "BD-DIEGO-2025-9481";
  const lodging = b.rate * b.nights;
  const taxes = Math.round((lodging + b.extras) * 0.05);
  const total = lodging + b.extras + taxes;
  const guests =
    b.adults + (b.adults > 1 ? " Adultes" : " Adulte") + (b.children ? `, ${b.children}${b.children > 1 ? " Enfants" : " Enfant"}` : "");
  const shortName = b.suite.split("•")[0].trim();
  const created = new Date(b.createdAt || Date.now());

  const map: Record<string, string> = {
    "#BD-DIEGO-2025-9481": "#" + ref,
    "BD-DIEGO-2025-9481": ref,
    "Suite Lagon • Mer d’Émeraude": b.suite,
    "65 100 Ar": formatMGA(b.rate),
    "14 Juin 2025": frDate(b.arrival),
    "18 Juin 2025": frDate(b.departure),
    "4 Nuits": b.nights + (b.nights > 1 ? " Nuits" : " Nuit"),
    "2 Adultes": guests,
    "Hébergement • 4 Nuitées": `Hébergement • ${b.nights}${b.nights > 1 ? " Nuitées" : " Nuitée"}`,
    "Suite Lagon @ 65 100 Ar / nuit": `${shortName} @ ${formatMGA(b.rate)} / nuit`,
    "260 400 Ar": formatMGA(lodging),
    "+48 800 Ar": b.extras ? "+" + formatMGA(b.extras) : "Non incluse",
    "48 800 Ar": b.extras ? formatMGA(b.extras) : "Non incluse",
    "15 500 Ar": formatMGA(taxes),
    "324 600 Ar": formatMGA(total),
    "97 400 Ar": formatMGA(total * 0.3),
    "227 200 Ar": formatMGA(total * 0.7),
    "Février 2025": `${MONTHS[created.getMonth()]} ${created.getFullYear()}`,
  };
  if (b.extrasLabel) {
    map["Catamaran Mer d'Émeraude"] = "Prestations sélectionnées";
    map["Excursion exclusive d'une journée"] = b.extrasLabel;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((n) => {
    const value = n.nodeValue || "";
    const key = value.trim().replace(/\u202f|\u00a0/g, " ");
    if (Object.prototype.hasOwnProperty.call(map, key)) n.nodeValue = value.replace(value.trim(), map[key]);
  });
  document.title = `Confirmation ${ref} • Hôtel Baie d'Or`;
}

function toast(message: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-full bg-espresso-dark text-[#FFFBF2] text-sm shadow-xl";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function initShare() {
  const btn = document.getElementById("btn-share");
  btn?.addEventListener("click", async () => {
    const data = { title: document.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    await navigator.clipboard?.writeText(data.url).catch(() => undefined);
    toast("Lien de la suite copié dans le presse-papiers");
  });
}

function initGallery() {
  const items = $all<HTMLElement>(".gallery-item");
  const lightbox = $<HTMLElement>("#gallery-lightbox");
  const image = $<HTMLImageElement>("#lightbox-image");
  const title = $("#lightbox-title");
  const subtitle = $("#lightbox-subtitle");
  const previous = $<HTMLButtonElement>("#lightbox-prev");
  const next = $<HTMLButtonElement>("#lightbox-next");
  let currentItem: HTMLElement | null = null;

  const showItem = (item: HTMLElement) => {
    const thumbnail = $<HTMLImageElement>("img", item);
    if (!thumbnail || !image || !title || !subtitle) return;
    currentItem = item;
    image.src = thumbnail.currentSrc || thumbnail.src;
    image.alt = thumbnail.alt || thumbnail.getAttribute("data-alt") || "Photo de la galerie";
    title.textContent = item.dataset.title || "Photo de l'hôtel";
    subtitle.textContent = item.dataset.subtitle || "";
  };

  items.forEach((item) => item.addEventListener("click", () => showItem(item)));
  const move = (direction: -1 | 1) => {
    const visibleItems = items.filter((item) => window.getComputedStyle(item).display !== "none");
    if (!visibleItems.length) return;
    const index = currentItem ? visibleItems.indexOf(currentItem) : -1;
    const nextIndex = (index + direction + visibleItems.length) % visibleItems.length;
    showItem(visibleItems[nextIndex]);
  };
  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.classList.contains("hidden")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "Escape") {
      $<HTMLButtonElement>("#lightbox-close")?.click();
    }
  });

  const fullscreen = $all("button").find((b) => /Mode Plein [ÉE]cran/i.test(b.textContent || ""));
  fullscreen?.addEventListener("click", () => {
    const first = $all(".gallery-item").find((el) => el.offsetParent !== null);
    first?.click();
  });
}

export function initSite(page: string) {
  const params = new URLSearchParams(window.location.search);
  initImageFallbacks();
  initSharedFormControls();
  if (page === "index") initHome();
  else if (page === "chambres") initRooms(params);
  else if (page === "suite") {
    initSuite();
    initShare();
  } else if (page === "galerie") initGallery();
  else if (page === "reservation") initReservation(params);
  else if (page === "legal") initLegal(params);
  else if (page === "confirmation") initConfirmation();
}
