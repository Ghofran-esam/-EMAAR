let fftChart, aeChart, trendChart;

const SELECT_KEY = "IDM_SELECTED_BUILDING";
const INSPECT_KEY = "IDM_INSPECTED_IDS"; // stores JSON array

function getSelectedBuildingId(){
  return localStorage.getItem(SELECT_KEY) || DemoStore.state.selectedBuildingId || null;
}

function setSelectedBuildingId(id){
  localStorage.setItem(SELECT_KEY, id);
}

function getInspectedSet(){
  try {
    const arr = JSON.parse(localStorage.getItem(INSPECT_KEY) || "[]");
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveInspectedSet(set){
  localStorage.setItem(INSPECT_KEY, JSON.stringify(Array.from(set)));
}

function pickBuilding(){
  const id = getSelectedBuildingId();
  const b = DemoStore.state.buildings.find(x => x.id === id) || DemoStore.state.buildings[0];
  if(b) setSelectedBuildingId(b.id);
  return b;
}

function badgeFor(level){
  if(level === "danger") return { cls:"danger", text:"EVACUATE" };
  if(level === "warn") return { cls:"warn", text:"MONITOR" };
  return { cls:"safe", text:"SAFE" };
}

// ---------- Demo signals -> charts ----------
function makeFftSeries(df){
  const labels = [];
  const values = [];
  const peak1 = 4.6 - (df * 20);
  const peak2 = 9.2 - (df * 10);
  const peak3 = 13.8 - (df * 6);

  for(let f=0; f<=20; f+=0.5){
    labels.push(f.toFixed(1));
    const g = (x, mu, sigma) => Math.exp(-0.5 * Math.pow((x-mu)/sigma, 2));
    let v =
      0.10 +
      0.70*g(f, peak1, 0.7) +
      0.40*g(f, peak2, 0.9) +
      0.25*g(f, peak3, 1.1) +
      (Math.random()*0.06);

    values.push(Number(v.toFixed(3)));
  }

  return { labels, values, peaks:[peak1, peak2, peak3].map(x=>Number(x.toFixed(2))) };
}

function makeAeCounts(ae){
  const labels = [];
  const values = [];
  for(let i=11; i>=0; i--){
    labels.push(`${i}h`);
  }
  const base = Math.max(0, Math.round(ae/6));
  for(let i=0; i<12; i++){
    const v = Math.max(0, base + Math.floor((Math.random()-0.3)*3));
    values.push(v);
  }
  return { labels, values };
}

function makeTrend(df, accel){
  const labels = [];
  const values = [];
  let cur = -0.006 - Math.random()*0.004;
  let slope = -(0.0006 + accel*0.00015);

  for(let d=1; d<=10; d++){
    labels.push(`Day ${d}`);
    cur += slope + (Math.random()-0.5)*0.0008;
    values.push(Number(cur.toFixed(4)));
  }

  return { labels, values, acceleration: accel };
}

// ---------- Render UI ----------
function renderHeader(b, risk){
  document.getElementById("bName").textContent = b.name;
  document.getElementById("bMeta").textContent =
    `${b.area} • ID: ${b.id} • Floors: ${b.floors} • Material: ${b.material} • Last update: ${new Date(b.lastUpdated).toLocaleString()}`;

  const badge = badgeFor(risk.level);
  const badgeEl = document.getElementById("bStatusBadge");

  // ✅ changed: badge -> statusBadge
  badgeEl.className = `statusBadge ${badge.cls}`;
  badgeEl.textContent = badge.text;

  document.getElementById("bRisk").textContent = `${risk.score}/100`;
}

function renderSensors(b){
  const tbody = document.getElementById("sensorTableBody");
  tbody.innerHTML = "";

  const sensors = [
    { id:`ACC-${b.id}-C1`, type:"Accelerometer", place:"Main column (C1)", reading:`Δf/f=${b.signals.df.toFixed(4)}`, status:"Online" },
    { id:`ACC-${b.id}-B1`, type:"Accelerometer", place:"Beam junction (B1)", reading:`Noise=${b.signals.noise.toFixed(2)}`, status:"Online" },
    { id:`AE-${b.id}-C2`,  type:"Acoustic Emission", place:"Column (C2)", reading:`Pulses/day=${b.signals.ae}`, status:"Online" },
    { id:`AE-${b.id}-J1`,  type:"Acoustic Emission", place:"Joint/Shear zone (J1)", reading:`Accel=${b.signals.accel.toFixed(2)}`, status:(Math.random()>0.9?"Degraded":"Online") },
  ];

  sensors.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid var(--line); font-weight:800;">${s.id}</td>
      <td style="padding:10px; border-bottom:1px solid var(--line); color:var(--muted);">${s.type}</td>
      <td style="padding:10px; border-bottom:1px solid var(--line);">${s.place}</td>
      <td style="padding:10px; border-bottom:1px solid var(--line); color:var(--muted);">${s.reading}</td>
      <td style="padding:10px; border-bottom:1px solid var(--line);">
        <!-- ✅ changed: badge -> statusBadge -->
        <span class="statusBadge ${s.status === "Online" ? "safe" : "warn"}">${s.status}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderXai(risk){
  const ul = document.getElementById("xaiList");
  ul.innerHTML = "";

  risk.reasons.slice(0,4).forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${r.key}</b>: ${r.value}`;
    ul.appendChild(li);
  });

  const extra = document.createElement("li");
  extra.innerHTML = `<b>Decision logic</b>: pattern-based scoring (resonance + AE + trend) under noise.`;
  ul.appendChild(extra);
}

function renderInspectionState(b){
  const inspected = getInspectedSet();
  const note = document.getElementById("inspectNote");
  if(inspected.has(b.id)){
    note.innerHTML = `✅ Marked as <b>Inspected</b>. (Demo flag stored locally)`;
  } else {
    note.innerHTML = `Not inspected yet. You can mark it after field verification.`;
  }
}

function buildCharts(b){
  const { df, ae, accel } = b.signals;

  const fft = makeFftSeries(df);
  const ctx1 = document.getElementById("fftChart");
  fftChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels: fft.labels,
      datasets: [{
        label: "FFT amplitude (demo)",
        data: fft.values,
        tension: 0.25,
        fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)", maxTicksLimit: 10 }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });

  const aeS = makeAeCounts(ae);
  const ctx2 = document.getElementById("aeChart");
  aeChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: aeS.labels,
      datasets: [{
        label: "Pulses",
        data: aeS.values
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });

  const tr = makeTrend(df, accel);
  const ctx3 = document.getElementById("trendChart");
  trendChart = new Chart(ctx3, {
    type: "line",
    data: {
      labels: tr.labels,
      datasets: [{
        label: "Δf/f trend (demo)",
        data: tr.values,
        tension: 0.25,
        fill: false
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function refreshAll(){
  const b = pickBuilding();
  const risk = DemoStore.computeRisk(b);

  renderHeader(b, risk);
  renderSensors(b);
  renderXai(risk);
  renderInspectionState(b);

  fftChart?.destroy();
  aeChart?.destroy();
  trendChart?.destroy();
  buildCharts(b);

  wireActions(b, risk);
}

function wireActions(b, risk){
  const createBtn = document.getElementById("createAlertBtn");
  const inspectBtn = document.getElementById("markInspectedBtn");

  createBtn.onclick = () => {
    DemoStore.state.recentAlerts.unshift({
      id: "AL-" + Math.floor(1000 + Math.random()*9000),
      severity: (risk.level === "danger") ? "critical" : "warning",
      title: (risk.level === "danger") ? "Manual alert: High collapse risk" : "Manual alert: Anomaly requires monitoring",
      loc: b.name,
      time: "Now",
      risk: risk.score
    });
    alert("✅ Alert created (demo). Check Dashboard → Recent Alerts.");
  };

  inspectBtn.onclick = () => {
    const inspected = getInspectedSet();
    inspected.add(b.id);
    saveInspectedSet(inspected);
    renderInspectionState(b);
    alert("✅ Marked as inspected (demo).");
  };
}

document.addEventListener("DOMContentLoaded", refreshAll);
