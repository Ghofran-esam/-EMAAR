/* sensors.js — Sensor Network page
   Depends on DemoStore from data.js
*/

let sensorMap;
const markerById = new Map();

function getCSS(varName){
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "";
}

function statusColor(status){
  // استخدم ألوان الـ root اللي عندك
  const red = getCSS("--evacuate") || "#ef4444";
  const yellow = getCSS("--monitor") || "#f59e0b";
  const green = getCSS("--safe") || "#22c55e";

  if (status === "OFFLINE") return red;
  if (status === "LOW_BATTERY") return yellow;
  return green;
}

function fmtBattery(v){ return `${v}%`; }
function fmtNoise(v){ return Number(v ?? 0).toFixed(2); }

function fmtLastSeen(iso){
  const t = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} h ago`;
}

function pillClass(status){
  if (status === "OFFLINE") return "danger";
  if (status === "LOW_BATTERY") return "warn";
  return "safe";
}

function initSensorMap(){
  sensorMap = L.map("sensorMap").setView([31.5207, 34.4534], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(sensorMap);

  renderSensorMarkers(DemoStore.state.sensors);
}

function renderSensorMarkers(sensors){
  markerById.clear();

  sensors.forEach(s => {
    const color = statusColor(s.status);

    const marker = L.circleMarker([s.lat, s.lng], {
      radius: 7,
      color,
      fillColor: color,
      fillOpacity: 0.95,
      weight: 2
    }).addTo(sensorMap);

    markerById.set(s.id, marker);

    marker.bindTooltip(`${s.id} • ${s.status} • ${s.battery}%`, { direction:"top" });

    marker.on("click", () => {
      openSensorPopup(s);
      highlightRow(s.id);
    });
  });
}

function openSensorPopup(sensor){
  const reading = sensor.lastReading || {};
  const building = DemoStore.state.buildings.find(b => b.id === sensor.buildingId);

  const html = `
    <div style="min-width:260px;">
      <div style="font-weight:900; font-size:14px;">${sensor.id}</div>
      <div class="muted" style="margin-top:2px;">
        Building: <b>${sensor.buildingId}</b>${building ? ` • ${building.name}` : ""}<br/>
        Type: <b>${sensor.type}</b> • Node: <b>${sensor.node}</b>
      </div>

      <div class="divider" style="margin:10px 0;"></div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div class="miniBox" style="flex:1; min-width:120px;">
          <div class="miniTitle">Status</div>
          <div><span class="statusPill ${pillClass(sensor.status)}">${sensor.status.replace("_"," ")}</span></div>
        </div>
        <div class="miniBox" style="flex:1; min-width:120px;">
          <div class="miniTitle">Battery</div>
          <div style="font-weight:900;">${fmtBattery(sensor.battery)}</div>
        </div>
      </div>

      <div class="divider" style="margin:10px 0;"></div>

      <div class="miniTitle">Last Seen</div>
      <div class="muted">${fmtLastSeen(sensor.lastSeen)} • (${new Date(sensor.lastSeen).toLocaleString()})</div>

      <div class="divider" style="margin:10px 0;"></div>

      <div class="miniTitle">Last Reading Snapshot (demo)</div>
      <ul class="miniList" style="margin:6px 0 0;">
        <li><b>Δf/f</b>: ${(Number(reading.df ?? 0)).toFixed(4)}</li>
        <li><b>AE events/day</b>: ${Number(reading.ae ?? 0)}</li>
        <li><b>Trend accel</b>: ${(Number(reading.accel ?? 0)).toFixed(2)}</li>
        <li><b>Noise</b>: ${(Number(sensor.noise ?? 0)).toFixed(2)}</li>
      </ul>
    </div>
  `;

  const marker = markerById.get(sensor.id);
  if (marker){
    marker.bindPopup(html, { closeButton:true, maxWidth: 340 }).openPopup();
  }
}

function setSensorKpis(sensors){
  const total = sensors.length;
  const active = sensors.filter(s => s.status === "ACTIVE").length;
  const offline = sensors.filter(s => s.status === "OFFLINE").length;
  const low = sensors.filter(s => s.status === "LOW_BATTERY").length;
  const avgNoise = total ? sensors.reduce((a,s)=>a + (Number(s.noise) || 0), 0) / total : 0;

  document.getElementById("kpiTotalSensors").textContent = total;
  document.getElementById("kpiActiveSensors").textContent = active;
  document.getElementById("kpiOfflineSensors").textContent = offline;
  document.getElementById("kpiLowBatterySensors").textContent = low;
  document.getElementById("kpiAvgNoise").textContent = avgNoise.toFixed(2);
}

function renderTable(sensors){
  const tbody = document.getElementById("sensorTbody");
  tbody.innerHTML = "";

  sensors.forEach(s => {
    const tr = document.createElement("tr");
    tr.dataset.sid = s.id;

    tr.innerHTML = `
      <td><span class="mono">${s.id}</span></td>
      <td><span class="mono">${s.buildingId}</span></td>
      <td><span class="statusPill ${pillClass(s.status)}">${s.status.replace("_"," ")}</span></td>
      <td>${fmtBattery(s.battery)}</td>
      <td>${fmtLastSeen(s.lastSeen)}</td>
      <td>${fmtNoise(s.noise)}</td>
    `;

    tr.addEventListener("click", () => {
      const m = markerById.get(s.id);
      if (m){
        sensorMap.setView([s.lat, s.lng], 16, { animate: true });
        openSensorPopup(s);
        highlightRow(s.id);
      }
    });

    tbody.appendChild(tr);
  });
}

function highlightRow(sensorId){
  document.querySelectorAll("#sensorTbody tr").forEach(r => r.classList.remove("rowActive"));
  const row = document.querySelector(`#sensorTbody tr[data-sid="${sensorId}"]`);
  if (row) row.classList.add("rowActive");
}

function applyFilters(){
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;

  let sensors = DemoStore.state.sensors.slice();

  if (status !== "ALL"){
    sensors = sensors.filter(s => s.status === status);
  }
  if (q){
    sensors = sensors.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.buildingId.toLowerCase().includes(q)
    );
  }

  renderTable(sensors);
  setSensorKpis(sensors);
}

document.addEventListener("DOMContentLoaded", () => {
  // ✅ ما في init — data.js أصلاً جاهّز DemoStore مباشرة
  // بس تأكدي انه sensors موجودين
  if (typeof DemoStore.ensureSensors === "function") {
    DemoStore.ensureSensors();
  }

  setSensorKpis(DemoStore.state.sensors);
  initSensorMap();
  renderTable(DemoStore.state.sensors);

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("statusFilter").addEventListener("change", applyFilters);
});
