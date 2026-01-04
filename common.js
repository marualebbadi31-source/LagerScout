// i18n + nav
const I18N = {
  de: {
    nav_home: "Start",
    nav_booking: "Zeitfenster buchen",
    nav_contact: "Kontakt",
    cta_demo: "Anfrage",
    footer_rights: "Alle Rechte vorbehalten.",
  },
  en: {
    nav_home: "Home",
    nav_booking: "Book time slot",
    nav_contact: "Contact",
    cta_demo: "Request",
    footer_rights: "All rights reserved.",
  }
};

function getLang(){
  return localStorage.getItem("lang") || "de";
}
function setLang(lang){
  localStorage.setItem("lang", lang);
  applyLang(lang);
}
function applyLang(lang){
  document.documentElement.lang = lang === "de" ? "de" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    const val = (I18N[lang] && I18N[lang][key]) || null;
    if(val) el.textContent = val;
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el=>{
    const key = el.getAttribute("data-i18n-html");
    const val = (I18N[lang] && I18N[lang][key]) || null;
    if(val) el.innerHTML = val;
  });
  const deBtn = document.getElementById("langDe");
  const enBtn = document.getElementById("langEn");
  if(deBtn && enBtn){
    deBtn.setAttribute("aria-pressed", String(lang === "de"));
    enBtn.setAttribute("aria-pressed", String(lang === "en"));
  }
}
(function initNav(){
  const year = document.getElementById("year");
  if(year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("navMenu");
  if(toggle && menu){
    toggle.addEventListener("click", ()=>{
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (e)=>{
      if(e.target.closest("a")){
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded","false");
      }
    });
    document.addEventListener("click",(e)=>{
      if(!menu.classList.contains("is-open")) return;
      if(menu.contains(e.target) || toggle.contains(e.target)) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded","false");
    });
  }

  const deBtn = document.getElementById("langDe");
  const enBtn = document.getElementById("langEn");
  if(deBtn) deBtn.addEventListener("click", ()=>setLang("de"));
  if(enBtn) enBtn.addEventListener("click", ()=>setLang("en"));

  applyLang(getLang());
})();
