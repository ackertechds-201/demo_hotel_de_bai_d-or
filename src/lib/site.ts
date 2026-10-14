/**
 * Shared behaviours layered on top of the exported pages: mobile navigation,
 * booking form calculations and validations (no reservation is submitted), and
 * deep links into the contact and legal tabs.
 */

type Calculation = { total: string; suiteName: string; nights: number };

declare global {
  interface Window {
    switchTab?: (tab: string) => void;
    switchLegalTab?: (tab: string) => void;
    updateCalculation?: () => Calculation;
  }
}

const DISPLAY_MGA_PER_EUR = 5085 / 25;

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
    if (!image.hasAttribute("alt")) {
      image.alt = image.getAttribute("data-alt")?.trim() || "Illustration de la maquette Hôtel Baie d'Or";
    }
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

function isoOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
    const params = new URLSearchParams({
      arrival,
      departure,
      stay: $<HTMLSelectElement>("#booking-stay")?.value || "tout-inclus",
      lodging: $<HTMLSelectElement>("#booking-lodging")?.value || "toutes",
      guests: $<HTMLSelectElement>("#booking-guests")?.value || "2-adultes",
    });
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
  const isISODate = (value: string | null): value is string => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const today = isoOffset(0);
  if (isISODate(arrival) && isISODate(departure) && arrival >= today && departure > arrival && dates[0] && dates[1]) {
    dates[0].value = arrival;
    dates[0].dispatchEvent(new Event("change", { bubbles: true }));
    dates[1].value = departure;
    dates[1].dispatchEvent(new Event("change", { bubbles: true }));
  }
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      const discover = target.closest<HTMLButtonElement>(".room-card .open-details-btn");
      if (discover) {
        e.stopPropagation();
        e.preventDefault();
        const card = discover.closest<HTMLElement>(".room-card");
        if (!card) return;
        const roomId = discover.dataset.roomId;
        if (!roomId) return;
        const roomTitle = card.querySelector("h2")?.textContent?.trim() || "Hébergement";
        const image = card.querySelector<HTMLImageElement>("img");
        const displayedPrice = card.querySelector(".font-headline-sm")?.textContent?.trim() || "Tarif sur demande";
        const amenities = Array.from(card.querySelectorAll<HTMLElement>(".flex.flex-wrap.items-center > span"))
          .map((item) => {
            const copy = item.cloneNode(true) as HTMLElement;
            copy.querySelectorAll(".material-symbols-outlined").forEach((icon) => icon.remove());
            return copy.textContent?.trim() || "";
          })
          .filter((item) => item && item !== "•");
        const roomData = {
          title: roomTitle,
          price: displayedPrice.replace(/\s*\/\s*nuitée$/i, ""),
          area: card.querySelector(".flex.items-baseline.justify-between > span:last-child")?.textContent?.trim() || "",
          location: card.querySelector("h2 + p")?.textContent?.trim() || "Diego-Suarez • Madagascar",
          description: card.querySelector(".line-clamp-2")?.textContent?.trim() || "",
          image: image?.currentSrc || image?.src || "",
          imageAlt: image?.alt || roomTitle,
          amenities,
        };
        const detailParams = new URLSearchParams({
          room: roomId,
          title: roomData.title,
          price: roomData.price,
          area: roomData.area,
          location: roomData.location,
          description: roomData.description,
          image: roomData.image,
          imageAlt: roomData.imageAlt,
          amenities: JSON.stringify(roomData.amenities),
        });
        goTo(`/suite?${detailParams.toString()}`);
        return;
      }
    },
    true,
  );
}

type RoomDetail = {
  title: string;
  price: string;
  area: string;
  location: string;
  description: string;
  image: string;
  imageAlt: string;
  amenities: string[];
};

function initSuite(params: URLSearchParams) {
  const roomId = params.get("room");
  if (roomId && roomId !== "emeraude") renderRoomDetail(roomId, params);
  const btn = $("#btn-simulate-booking");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const arrival = $<HTMLInputElement>("#input-checkin")?.value || isoOffset(30);
    const departure = $<HTMLInputElement>("#input-checkout")?.value || isoOffset(34);
    const checkin = $<HTMLInputElement>("#input-checkin");
    const checkout = $<HTMLInputElement>("#input-checkout");
    if (!checkin || !checkout) return;
    checkout.setCustomValidity(departure > arrival ? "" : "La date de départ doit être postérieure à la date d'arrivée.");
    if (!checkin.reportValidity() || !checkout.reportValidity()) return;
  });
}

function renderRoomDetail(roomId: string, params: URLSearchParams) {
  let amenities: string[] = [];
  try {
    amenities = JSON.parse(params.get("amenities") || "[]") as string[];
  } catch {
    amenities = [];
  }
  const roomIds = new Set(["alize", "emeraude", "sakalava", "ramena", "nosylonjo", "penthouse"]);
  let safeImage = "";
  try {
    const imageUrl = new URL(params.get("image") || "", window.location.origin);
    if (imageUrl.protocol === "https:" && ["lh3.googleusercontent.com", "images.unsplash.com"].includes(imageUrl.hostname)) {
      safeImage = imageUrl.href;
    }
  } catch {
    safeImage = "";
  }
  if (!roomIds.has(roomId)) return;
  const room: RoomDetail = {
    title: params.get("title") || "Hébergement",
    price: params.get("price") || "Tarif indicatif",
    area: params.get("area") || "",
    location: params.get("location") || "Diego-Suarez • Madagascar",
    description: params.get("description") || "",
    image: safeImage,
    imageAlt: params.get("imageAlt") || "Hébergement de démonstration",
    amenities: amenities.filter((item) => typeof item === "string").slice(0, 8),
  };
  if (roomId.length > 40) return;
  if (!room.title || !room.image) return;

  const main = $("main");
  if (!main) return;
  document.title = `${room.title} | Hôtel Baie d'Or`;
  const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
  const features = room.amenities.map((item) => `<li class="flex items-center gap-2 rounded-full bg-[#FAF5EB] px-4 py-2 text-sm text-[#504536]"><span class="text-[#805600]">✦</span>${esc(item)}</li>`).join("");
  main.innerHTML = `
    <div class="flex w-full flex-col bg-[#FAF5EB]">
      <section class="w-full border-b border-[#E8DCBE] bg-[#FFFBF2]"><div class="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-6 py-3 text-[13px] text-[#6f5a4f]">
        <a class="font-medium hover:text-[#805600]" href="/">Accueil</a><span>›</span><a class="font-medium hover:text-[#805600]" href="/chambres">Chambres &amp; Suites</a><span>›</span><span class="font-semibold text-[#1F1610]">${esc(room.title)}</span>
      </div></section>
      <section class="w-full py-8"><div class="mx-auto flex max-w-[1240px] flex-col gap-5 px-6">
        <div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div class="flex max-w-3xl flex-col gap-3"><div class="flex flex-wrap items-center gap-2"><span class="rounded-full border border-[#E5A93C]/40 bg-[#E5A93C]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#614000]">Hébergement de la Baie d'Or</span><span class="rounded-full border border-[#E8DCBE] bg-[#F5EAD6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#564338]">${esc(room.location)}</span></div>
            <h1 class="font-serif text-3xl font-medium leading-tight tracking-tight text-[#1F1610] sm:text-4xl lg:text-5xl">${esc(room.title)}</h1>
            <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6f5a4f]"><span>${esc(room.area)}</span><span>•</span><span>${esc(room.amenities[0] || "Séjour de charme")}</span></div>
          </div><div class="flex items-baseline gap-2 self-start rounded-2xl border border-[#E8DCBE] bg-[#FFFBF2] px-5 py-3 shadow-sm lg:self-end"><span class="text-[11px] font-bold uppercase tracking-wider text-[#6f5a4f]">Tarif indicatif</span><span class="font-serif text-3xl font-bold tracking-tight text-[#1F1610]">${esc(room.price)}</span></div>
        </div>
      </div></section>
      <section class="w-full pb-10"><div class="mx-auto max-w-[1240px] px-6"><div class="group relative h-[320px] overflow-hidden rounded-3xl border border-[#E8DCBE] bg-[#F2EDE3] shadow-[0_12px_32px_rgba(31,22,16,0.08)] sm:h-[420px] md:h-[540px]"><img class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src="${esc(room.image)}" alt="${esc(room.imageAlt)}"/><div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div><span class="absolute bottom-5 left-5 rounded-full border border-[#E8DCBE]/60 bg-[#FFFBF2]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1F1610]">${esc(room.location)}</span></div></div></section>
      <section class="w-full pb-20"><div class="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-8 px-6 lg:grid-cols-12">
        <article class="flex flex-col gap-6 rounded-3xl border border-[#E8DCBE] bg-[#FFFBF2] p-7 shadow-sm md:p-10 lg:col-span-8">
          <div><span class="text-[12px] font-bold uppercase tracking-widest text-[#805600]">Atmosphère &amp; Concept</span><h2 class="mt-2 font-serif text-2xl font-medium text-[#1F1610] sm:text-3xl">${esc(room.title)}</h2></div>
          <p class="text-[17px] leading-relaxed text-[#504536]">${esc(room.description)}</p><p class="text-[15px] leading-relaxed text-[#6f5a4f]">${esc(room.location)} • Un hébergement pensé pour profiter pleinement du confort, de la nature et des paysages du nord de Madagascar.</p>
          <div class="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3"><div class="rounded-2xl border border-[#E8DCBE] bg-[#FAF5EB] p-4"><span class="text-[11px] font-bold uppercase tracking-wider text-[#6f5a4f]">Superficie</span><p class="mt-1 font-serif text-lg font-bold text-[#1F1610]">${esc(room.area)}</p></div><div class="rounded-2xl border border-[#E8DCBE] bg-[#FAF5EB] p-4"><span class="text-[11px] font-bold uppercase tracking-wider text-[#6f5a4f]">Emplacement</span><p class="mt-1 font-serif text-lg font-bold text-[#1F1610]">${esc(room.location.split("•")[0].trim())}</p></div><div class="rounded-2xl border border-[#E8DCBE] bg-[#FAF5EB] p-4"><span class="text-[11px] font-bold uppercase tracking-wider text-[#6f5a4f]">Tarif</span><p class="mt-1 font-serif text-lg font-bold text-[#1F1610]">${esc(room.price)}</p></div></div>
          <div class="pt-2"><h3 class="font-serif text-2xl font-medium text-[#1F1610]">Équipements &amp; points forts</h3><ul class="mt-4 flex flex-wrap gap-2">${features}</ul></div>
        </article>
        <aside class="sticky top-28 flex flex-col gap-4 rounded-3xl border border-[#E8DCBE] bg-[#FFFBF2] p-6 shadow-sm lg:col-span-4"><span class="text-[12px] font-bold uppercase tracking-widest text-[#805600]">Votre séjour</span><h2 class="font-serif text-2xl font-medium text-[#1F1610]">${esc(room.title)}</h2><p class="text-sm text-[#6f5a4f]">${esc(room.price)} / nuitée</p><a href="/reservation" class="mt-2 inline-flex justify-center rounded-full bg-[#261A13] px-6 py-3 font-semibold text-[#FFFBF2] transition hover:bg-[#835425]">Réserver ce séjour</a><a href="/chambres" class="text-center text-sm font-semibold text-[#805600] hover:underline">Retour aux hébergements</a></aside>
      </div></section>
    </div>`;
}

function initReservation(params: URLSearchParams) {
  if (params.get("tab") === "contact") window.switchTab?.("contact");
}

function initLegal(params: URLSearchParams) {
  const tab = params.get("tab");
  if (tab && document.getElementById(`tab-${tab}`)) window.switchLegalTab?.(tab);
}

function initConfirmation() {
  document.title = "Exemple de simulation • Hôtel Baie d'Or";
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

function initScrollMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const selector = [
    "main > section",
    "main > div > section",
    "main > div > div > section",
    "main > div > div > div > section",
    ".room-card",
    ".faq-item",
    ".faq-card",
    ".gallery-item",
    ".service-card",
    "#explore .group.flex.flex-col",
  ].join(",");
  const elements = Array.from(new Set($all<HTMLElement>(selector))).filter(
    (element) => !element.closest("[aria-hidden='true'], .fixed[role='dialog']") && !element.hasAttribute("data-scroll-state"),
  );
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        element.dataset.scrollState = entry.isIntersecting ? "visible" : "hidden";
      });
    },
    { rootMargin: "-5% 0px -8% 0px", threshold: 0.02 },
  );

  elements.forEach((element, index) => {
    element.style.transitionDelay = `${(index % 4) * 65}ms`;
    element.dataset.scrollState = "hidden";
    observer.observe(element);
  });
}

export function initSite(page: string) {
  const params = new URLSearchParams(window.location.search);
  initImageFallbacks();
  initSharedFormControls();
  if (page === "index") initHome();
  else if (page === "chambres") initRooms(params);
  else if (page === "suite") {
    initSuite(params);
    initShare();
  } else if (page === "galerie") initGallery();
  else if (page === "reservation") initReservation(params);
  else if (page === "legal") initLegal(params);
  else if (page === "confirmation") initConfirmation();
  initScrollMotion();
}
