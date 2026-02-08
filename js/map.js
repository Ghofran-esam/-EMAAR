let map;
let selectedBuilding = null;

// layers
let markersLayer = L.layerGroup();
let heatLayer = L.layerGroup();
let heatOn = false;

function getCSS(varName, fallback) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

function levelColor(level) {
  if (level === "danger") return getCSS("--evacuate", "#ef4444");
  if (level === "warn") return getCSS("--monitor", "#f59e0b");
  return getCSS("--safe", "#22c55e");
}

// heat style based on score
function heatColor(score) {
  if (score >= 85) return getCSS("--evacuate", "#ef4444");
  if (score >= 65) return getCSS("--monitor", "#f59e0b");
  return getCSS("--safe", "#22c55e");
}

function heatRadius(score) {
  // meters: 0..100 => 140..560
  return Math.round(140 + (score / 100) * 420);
}

function heatOpacity(score) {
  // 0..100 => 0.10..0.35
  return Number((0.10 + (score / 100) * 0.25).toFixed(2));
}

function initMap() {
  map = L.map("map").setView([31.5207, 34.4534], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  // add default layer
  markersLayer.addTo(map);

  renderMarkers();
  buildHeatOverlay();
  setHeatMode(false);
}

function renderMarkers() {
  markersLayer.clearLayers();

  DemoStore.state.buildings.forEach((b) => {
    const risk = DemoStore.computeRisk(b);

    const marker = L.circleMarker([b.lat, b.lng], {
      radius: 10,
      color: levelColor(risk.level),
      fillColor: levelColor(risk.level),
      fillOpacity: 0.9,
      weight: 2,
    });

    marker.bindTooltip(`${b.name} — Risk ${risk.score}`, { direction: "top" });

    marker.on("click", () => {
      selectedBuilding = { ...b, risk };
      DemoStore.state.selectedBuildingId = b.id;

      // store selected building for building.html
      localStorage.setItem("IDM_SELECTED_BUILDING", b.id);

      renderDetails();
    });

    marker.addTo(markersLayer);
  });
}

function buildHeatOverlay() {
  heatLayer.clearLayers();

  DemoStore.state.buildings.forEach((b) => {
    const r = DemoStore.computeRisk(b);

    const circle = L.circle([b.lat, b.lng], {
      radius: heatRadius(r.score),
      color: heatColor(r.score),
      weight: 1,
      fillColor: heatColor(r.score),
      fillOpacity: heatOpacity(r.score),
    });

    circle.bindTooltip(`${b.name} — Risk ${r.score}`, { direction: "top" });

    // clicking heat also opens details
    circle.on("click", () => {
      selectedBuilding = { ...b, risk: r };
      DemoStore.state.selectedBuildingId = b.id;
      localStorage.setItem("IDM_SELECTED_BUILDING", b.id);
      renderDetails();
    });

    circle.addTo(heatLayer);
  });
}

function setHeatMode(on) {
  heatOn = on;

  if (heatOn) {
    // show heat only
    if (!map.hasLayer(heatLayer)) heatLayer.addTo(map);
    if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
  } else {
    // show markers only
    if (!map.hasLayer(markersLayer)) markersLayer.addTo(map);
    if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
  }

  // optional: update button label
  const btn = document.getElementById("toggleHeatBtn");
if (btn) btn.textContent = heatOn ? "Show Markers" : "Show Heat";
}

function renderDetails() {
  const box = document.getElementById("buildingCard");
  if (!selectedBuilding) {
    box.innerHTML = `<div class="muted">Select a building on the map.</div>`;
    return;
  }

  const r = selectedBuilding.risk;
  const badgeClass =
    r.level === "danger" ? "danger" : r.level === "warn" ? "warn" : "safe";
  const levelLabel =
    r.level === "danger" ? "EVACUATE" : r.level === "warn" ? "MONITOR" : "SAFE";

  const top3 = (r.reasons || [])
    .slice(0, 3)
    .map((x) => `<li><b>${x.key}</b>: ${x.value}</li>`)
    .join("");

  box.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
      <div>
        <div style="font-weight:900; font-size:16px;">${selectedBuilding.name}</div>
        <div class="muted">${selectedBuilding.area} • ID: ${selectedBuilding.id}</div>
      </div>
      <div class="badgeTag ${badgeClass}">${levelLabel}</div>
    </div>

    <div class="divider"></div>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div class="miniBox" style="flex:1; min-width:140px;">
        <div class="miniTitle">Risk Score</div>
        <div style="font-size:26px; font-weight:1000;">${r.score}/100</div>
      </div>

      <div class="miniBox" style="flex:1; min-width:220px;">
        <div class="miniTitle">Recommendation</div>
        <div class="muted">${r.recommendation}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="miniTitle">Top Signals</div>
    <ul class="miniList">${top3}</ul>

    <div class="divider"></div>

    <div class="actions">
      <a class="btn primary full" href="building.html" id="openBuildingBtn">Open Building Details</a>
    </div>
  `;

  localStorage.setItem("IDM_SELECTED_BUILDING", selectedBuilding.id);

  const btn = document.getElementById("downloadReportBtn");
  if (btn) btn.disabled = false;
}

function downloadReportDemo() {
  if (!selectedBuilding) return;

  const r = selectedBuilding.risk;

  const html = `
  <html>
  <head>
    <title>Building Report</title>
    <style>
      body{font-family:Arial; padding:24px;}
      h1{margin:0 0 6px 0;}
      .muted{color:#555}
      .box{border:1px solid #ddd; padding:12px; border-radius:10px; margin-top:12px;}
      .row{display:flex; gap:12px; flex-wrap:wrap;}
      .pill{display:inline-block; padding:6px 10px; border-radius:999px; border:1px solid #ddd;}
    </style>
  </head>
  <body>
    <h1>Invisible Damage Mapper — Building Report</h1>
    <div class="muted">Generated: ${new Date().toLocaleString()}</div>

    <div class="box">
      <b>Building:</b> ${selectedBuilding.name} <br/>
      <b>Area:</b> ${selectedBuilding.area} <br/>
      <b>ID:</b> ${selectedBuilding.id} <br/>
      <b>Coordinates:</b> ${selectedBuilding.lat.toFixed(4)}, ${selectedBuilding.lng.toFixed(4)}
    </div>

    <div class="row">
      <div class="box" style="flex:1; min-width:220px;">
        <b>Risk Score:</b> ${r.score}/100<br/>
        <span class="pill">${r.level.toUpperCase()}</span>
      </div>

      <div class="box" style="flex:2; min-width:260px;">
        <b>Recommendation:</b><br/>
        ${r.recommendation}
      </div>
    </div>

    <div class="box">
      <b>Top signals:</b>
      <ul>
        ${(r.reasons || []).map(x => `<li>${x.key}: ${x.value}</li>`).join("")}
      </ul>
    </div>

    <div class="muted" style="margin-top:16px;">
      Demo prototype — computed using resonance shift, acoustic emissions, and trend acceleration.
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();

  const dl = document.getElementById("downloadReportBtn");
  if (dl) dl.addEventListener("click", downloadReportDemo);

  const toggleBtn = document.getElementById("toggleHeatBtn");
  if (toggleBtn) {
toggleBtn.addEventListener("click", () => {
  setHeatMode(!heatOn);

  // visual active state
  toggleBtn.classList.toggle("active", heatOn);
});

  }
});
