// Booking calendar (demo) with fake companies + localStorage for user bookings.
const BOOK_KEY = "lagerscout_bookings_v1";

const BookingI18N = {
  de: {
    page_title: "Zeitfenster buchen",
    page_desc: "Speditionen/Disponenten können hier ein Zeitfenster reservieren. Demo-Kalender mit generierten Firmen.",
    form_title: "Neue Reservierung",
    company: "Spedition / Firma",
    contact: "Kontakt (Name)",
    plate: "Kennzeichen",
    cargo: "Bereich",
    day: "Tag",
    time: "Uhrzeit",
    duration: "Dauer",
    dock: "Rampe",
    notes: "Notiz (optional)",
    add: "Reservieren",
    price_hint: "Ein Zeitfenster kostet ca. <strong>100 €</strong>.",
    policy_title: "Wichtig: Zeitfenster-Regel",
    policy_html: "Bitte pünktlich erscheinen. Wenn Sie <strong>nicht im gebuchten Zeitfenster</strong> ankommen bzw. abfertigbar sind, besteht <strong>keine Berechtigung zum Entladen</strong> (Sperre/Zurückweisung möglich).",
    cal_title: "Kalender",
    week_label: "Woche",
    prev: "← Vorherige",
    next: "Nächste →",
    filter: "Filter",
    show_all: "Alle",
    show_mine: "Nur meine",
    checkin: "Ankunft bestätigen",
    delete: "Löschen",
    late: "Zu spät",
    ontime: "Pünktlich",
    status_blocked: "Gesperrt",
    status_ok: "OK",
    status_note: "Status wird nach Ankunft berechnet (Demo).",
    toast_added: "Reservierung gespeichert (lokal).",
    toast_deleted: "Reservierung gelöscht.",
    toast_late: "Ankunft zu spät — Status: gesperrt (Demo).",
    toast_ontime: "Ankunft innerhalb des Fensters — OK (Demo)."
  },
  en: {
    page_title: "Book a time slot",
    page_desc: "Forwarders/dispatchers can reserve a time slot here. Demo calendar with generated companies.",
    form_title: "New reservation",
    company: "Forwarder / Company",
    contact: "Contact (name)",
    plate: "License plate",
    cargo: "Area",
    day: "Day",
    time: "Time",
    duration: "Duration",
    dock: "Dock",
    notes: "Note (optional)",
    add: "Reserve",
    price_hint: "A time slot costs around <strong>€100</strong>.",
    policy_title: "Important: time slot policy",
    policy_html: "Please arrive on time. If you <strong>do not arrive within your booked slot</strong> (or cannot be processed), you may <strong>lose permission to unload</strong> (block/refusal possible).",
    cal_title: "Calendar",
    week_label: "Week",
    prev: "← Previous",
    next: "Next →",
    filter: "Filter",
    show_all: "All",
    show_mine: "Only mine",
    checkin: "Confirm arrival",
    delete: "Delete",
    late: "Late",
    ontime: "On time",
    status_blocked: "Blocked",
    status_ok: "OK",
    status_note: "Status is calculated after arrival (demo).",
    toast_added: "Reservation saved (local).",
    toast_deleted: "Reservation deleted.",
    toast_late: "Arrival late — status: blocked (demo).",
    toast_ontime: "Arrival within slot — OK (demo)."
  }
};

function lang(){ return localStorage.getItem("lang") || "de"; }
function t(key){
  return (BookingI18N[lang()] && BookingI18N[lang()][key]) || key;
}
function applyBookingLang(){
  document.querySelectorAll("[data-i18n-b]").forEach(el=>{
    const key = el.getAttribute("data-i18n-b");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-b-html]").forEach(el=>{
    const key = el.getAttribute("data-i18n-b-html");
    el.innerHTML = t(key);
  });
}

function loadUserBookings(){
  try{
    const raw = localStorage.getItem(BOOK_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}
function saveUserBookings(arr){
  localStorage.setItem(BOOK_KEY, JSON.stringify(arr));
}

function uuid(){
  return "b_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const docks = ["A1","A2","A3","B1","B2","C1"];
const cargoAreas = [
  {value:"frische", de:"Frische", en:"Fresh"},
  {value:"trocken", de:"Trockene Ware", en:"Dry goods"},
  {value:"tiefkuehl", de:"Tiefkühl", en:"Frozen"},
  {value:"obstgemuese", de:"Obst & Gemüse", en:"Fruit & Vegetables"}
];

function cargoLabel(val){
  const it = cargoAreas.find(x=>x.value===val);
  if(!it) return val;
  return lang()==="de" ? it.de : it.en;
}

function formatDate(d){
  return d.toISOString().slice(0,10);
}
function startOfWeek(d){
  const x = new Date(d);
  const day = (x.getDay()+6)%7; // Monday=0
  x.setDate(x.getDate()-day);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d,n){
  const x = new Date(d);
  x.setDate(x.getDate()+n);
  return x;
}
function pad(n){ return String(n).padStart(2,"0"); }
function timeToMin(t){ const [h,m]=t.split(":").map(Number); return h*60+m; }
function minToTime(m){ const h=Math.floor(m/60), mm=m%60; return pad(h)+":"+pad(mm); }

function seededRand(seed){
  // simple LCG
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function(){
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  }
}

const fakeNames = ["NordTrans GmbH","Spedimax Logistics","CargoFlow AG","RheinSped","Baltic Freight","WestLine Transport","Alpina Spedition","HansaMove","EuroHaul","CityCargo"];
const fakeContacts = ["M. Becker","S. Wagner","A. Klein","J. Neumann","L. Fischer","K. Hoffmann","P. Weber","T. Schäfer","N. Koch","D. Richter"];

function generateFakeBookings(weekStart){
  // Different patterns per weekday: Mon busier, Fri shorter, weekend minimal.
  const out = [];
  for(let i=0;i<7;i++){
    const dayDate = addDays(weekStart,i);
    const dow = dayDate.getDay(); // 0 Sun..6 Sat
    const seed = Number(formatDate(dayDate).replaceAll("-",""));
    const rnd = seededRand(seed);
    let count = 0;
    if(dow===1) count = 7;         // Mon
    else if(dow===2) count = 6;    // Tue
    else if(dow===3) count = 6;    // Wed
    else if(dow===4) count = 5;    // Thu
    else if(dow===5) count = 4;    // Fri
    else if(dow===6) count = 2;    // Sat
    else count = 1;               // Sun

    for(let k=0;k<count;k++){
      const company = fakeNames[Math.floor(rnd()*fakeNames.length)];
      const contact = fakeContacts[Math.floor(rnd()*fakeContacts.length)];
      const dock = docks[Math.floor(rnd()*docks.length)];
      const area = cargoAreas[Math.floor(rnd()*cargoAreas.length)].value;

      // slot time patterns
      const base = (dow===5 ? 7*60 : 6*60); // Fri start later
      const span = (dow===0 || dow===6) ? 6*60 : 12*60; // weekend smaller
      const startMin = base + Math.floor(rnd()*(span/30))*30;
      const dur = [30,60,60,90][Math.floor(rnd()*4)];
      out.push({
        id: "fake_"+seed+"_"+k,
        kind:"fake",
        date: formatDate(dayDate),
        time: minToTime(startMin),
        duration: dur,
        dock,
        company,
        contact,
        plate: "XX-" + Math.floor(100+rnd()*900),
        cargo: area,
        notes: "",
        price: 100,
        status: "ok"
      });
    }
  }
  return out;
}

function overlaps(a,b){
  if(a.date!==b.date || a.dock!==b.dock) return false;
  const as = timeToMin(a.time), ae = as + a.duration;
  const bs = timeToMin(b.time), be = bs + b.duration;
  return Math.max(as,bs) < Math.min(ae,be);
}

function toast(msg){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=>el.classList.remove("show"), 2400);
}

function renderWeekLabel(weekStart){
  const end = addDays(weekStart,6);
  const opts = {year:"numeric",month:"short",day:"2-digit"};
  const s = weekStart.toLocaleDateString(lang()==="de"?"de-DE":"en-GB", opts);
  const e = end.toLocaleDateString(lang()==="de"?"de-DE":"en-GB", opts);
  document.getElementById("weekLabel").textContent = `${t("week_label")}: ${s} — ${e}`;
}

function weekdayName(d){
  return d.toLocaleDateString(lang()==="de"?"de-DE":"en-GB",{weekday:"short"});
}

function buildGrid(weekStart, bookings, filterMine){
  const tbody = document.getElementById("calBody");
  tbody.innerHTML = "";

  // times from 06:00 to 18:00 (Mon-Fri), weekend 08:00-14:00 (but we still show full grid for simplicity)
  const times = [];
  for(let m=6*60;m<=18*60;m+=60){ times.push(m); } // 1h rows for readability

  for(const m of times){
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = minToTime(m);
    tr.appendChild(th);

    for(let i=0;i<7;i++){
      const day = addDays(weekStart,i);
      const date = formatDate(day);

      const td = document.createElement("td");
      const box = document.createElement("div");
      box.className = "slot";

      const dayBookings = bookings
        .filter(b=>b.date===date && timeToMin(b.time) >= m && timeToMin(b.time) < m+60)
        .filter(b=>!filterMine || b.kind==="user");

      // group by start time within the hour
      for(const b of dayBookings.sort((x,y)=>timeToMin(x.time)-timeToMin(y.time))){
        const bEl = document.createElement("div");
        bEl.className = "book";
        const endTime = minToTime(timeToMin(b.time)+b.duration);

        const top = document.createElement("div");
        top.className = "book__top";
        const c = document.createElement("div");
        c.className = "book__c";
        c.textContent = `${b.company} (${b.time}–${endTime})`;

        const tag = document.createElement("span");
        tag.className = "tag " + (b.status==="blocked" ? "tag--bad" : (b.kind==="user" ? "tag--warn" : "tag--ok"));
        tag.textContent = b.status==="blocked" ? t("status_blocked") : t("status_ok");

        top.appendChild(c);
        top.appendChild(tag);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${cargoLabel(b.cargo)} • Dock ${b.dock} • ${b.contact} • ${b.plate}`;

        bEl.appendChild(top);
        bEl.appendChild(meta);

        if(b.kind==="user"){
          const actions = document.createElement("div");
          actions.className = "actions";

          const checkin = document.createElement("button");
          checkin.type="button";
          checkin.className="btn btn--ghost btn--small";
          checkin.textContent = t("checkin");
          checkin.addEventListener("click", ()=>checkIn(b.id));

          const del = document.createElement("button");
          del.type="button";
          del.className="btn btn--ghost btn--small";
          del.textContent = t("delete");
          del.addEventListener("click", ()=>deleteBooking(b.id));

          actions.appendChild(checkin);
          actions.appendChild(del);
          bEl.appendChild(actions);

          const hint = document.createElement("div");
          hint.className="meta";
          hint.textContent = t("status_note");
          bEl.appendChild(hint);
        }

        box.appendChild(bEl);
      }

      td.appendChild(box);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // headers
  const headRow = document.getElementById("calHead");
  headRow.innerHTML = `<th></th>` + Array.from({length:7}).map((_,i)=>{
    const day = addDays(weekStart,i);
    const d = day.toLocaleDateString(lang()==="de"?"de-DE":"en-GB",{day:"2-digit",month:"2-digit"});
    return `<th>${weekdayName(day)}<br><span class="muted">${d}</span></th>`;
  }).join("");
}

let weekStart = startOfWeek(new Date());
let fakeBookings = generateFakeBookings(weekStart);

function getAllBookings(){
  const user = loadUserBookings();
  return [...fakeBookings, ...user];
}

function refresh(){
  applyBookingLang();
  renderWeekLabel(weekStart);

  // keep fake bookings synced with current week
  fakeBookings = generateFakeBookings(weekStart);

  const filterMine = (document.getElementById("filterSel").value === "mine");
  const all = getAllBookings();

  buildGrid(weekStart, all, filterMine);

  // KPIs
  const userCount = loadUserBookings().filter(b=>b.date>=formatDate(weekStart)&&b.date<=formatDate(addDays(weekStart,6))).length;
  document.getElementById("kpiMine").textContent = String(userCount);
  document.getElementById("kpiPrice").textContent = "€100";
  document.getElementById("kpiDocks").textContent = String(docks.length);
}

function addBooking(b){
  const user = loadUserBookings();

  // Check conflicts against ALL bookings (fake+user) for same dock/date
  const all = [...fakeBookings, ...user];
  const conflict = all.some(x=>overlaps(x,b));
  b.status = conflict ? "blocked" : "ok"; // conflict => blocked (demo)
  b.conflict = conflict;

  user.push(b);
  saveUserBookings(user);
  toast(t("toast_added"));
  refresh();
}

function deleteBooking(id){
  const user = loadUserBookings().filter(b=>b.id!==id);
  saveUserBookings(user);
  toast(t("toast_deleted"));
  refresh();
}

function checkIn(id){
  const user = loadUserBookings();
  const b = user.find(x=>x.id===id);
  if(!b) return;
  const end = minToTime(timeToMin(b.time)+b.duration);
  const input = prompt(lang()==="de" ? `Ankunftszeit eingeben (HH:MM). Gebucht: ${b.time}–${end}` : `Enter arrival time (HH:MM). Booked: ${b.time}–${end}`);
  if(!input) return;
  const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(input.trim());
  if(!ok) return;

  const arr = timeToMin(input.trim());
  const start = timeToMin(b.time);
  const endMin = start + b.duration;

  b.arrival = input.trim();
  if(arr > endMin){
    b.status = "blocked";
    toast(t("toast_late"));
  }else{
    b.status = "ok";
    toast(t("toast_ontime"));
  }
  saveUserBookings(user);
  refresh();
}

function populateSelects(){
  const dockSel = document.getElementById("dock");
  dockSel.innerHTML = docks.map(d=>`<option value="${d}">${d}</option>`).join("");

  const cargoSel = document.getElementById("cargo");
  cargoSel.innerHTML = cargoAreas.map(a=>{
    const lbl = lang()==="de" ? a.de : a.en;
    return `<option value="${a.value}">${lbl}</option>`;
  }).join("");

  const daySel = document.getElementById("day");
  // 7 days of current week
  daySel.innerHTML = Array.from({length:7}).map((_,i)=>{
    const d = addDays(weekStart,i);
    const label = `${weekdayName(d)} ${d.toLocaleDateString(lang()==="de"?"de-DE":"en-GB",{day:"2-digit",month:"2-digit"})}`;
    return `<option value="${formatDate(d)}">${label}</option>`;
  }).join("");

  const timeSel = document.getElementById("time");
  // times every 30 min (06:00-18:00)
  const times = [];
  for(let m=6*60;m<=18*60;m+=30) times.push(minToTime(m));
  timeSel.innerHTML = times.map(x=>`<option value="${x}">${x}</option>`).join("");

  const durSel = document.getElementById("duration");
  durSel.innerHTML = [30,60,90,120].map(m=>{
    const label = lang()==="de" ? `${m} Min` : `${m} min`;
    return `<option value="${m}">${label}</option>`;
  }).join("");
}

function wireForm(){
  const form = document.getElementById("bookForm");
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const b = {
      id: uuid(),
      kind:"user",
      company: data.company.trim() || (lang()==="de" ? "Meine Spedition" : "My company"),
      contact: data.contact.trim() || "-",
      plate: data.plate.trim() || "-",
      cargo: data.cargo,
      date: data.day,
      time: data.time,
      duration: Number(data.duration),
      dock: data.dock,
      notes: (data.notes||"").trim(),
      price: 100,
      status: "ok"
    };
    addBooking(b);
    form.reset();
  });
}

function wireControls(){
  document.getElementById("prevWeek").addEventListener("click", ()=>{
    weekStart = addDays(weekStart,-7);
    populateSelects();
    refresh();
  });
  document.getElementById("nextWeek").addEventListener("click", ()=>{
    weekStart = addDays(weekStart,7);
    populateSelects();
    refresh();
  });
  document.getElementById("filterSel").addEventListener("change", refresh);

  // reapply language changes from header buttons
  window.addEventListener("storage", (e)=>{
    if(e.key==="lang"){
      applyBookingLang();
      populateSelects();
      refresh();
    }
  });
}

// init
(function(){
  applyBookingLang();
  populateSelects();
  wireForm();
  wireControls();
  refresh();

  // also re-run when language buttons clicked (same tab)
  const deBtn = document.getElementById("langDe");
  const enBtn = document.getElementById("langEn");
  if(deBtn) deBtn.addEventListener("click", ()=>{ setTimeout(()=>{populateSelects();refresh();}, 0); });
  if(enBtn) enBtn.addEventListener("click", ()=>{ setTimeout(()=>{populateSelects();refresh();}, 0); });
})();
