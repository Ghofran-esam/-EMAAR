/* alerts.js
   Requires DemoStore.ensureAlerts(), DemoStore.getAlerts(), DemoStore.ackAlert()
*/

function sevToPill(sev){
  if (sev === "CRITICAL") return "danger";
  if (sev === "WARNING") return "warn";
  return "safe";
}

function renderCurrent(){
  const data = DemoStore.getAlerts();
  const list = data.current || [];

  if (!list.length){
    return `
      <div class="muted">No active alerts right now (demo).</div>
    `;
  }

  const rows = list.map(a => `
    <div class="alertItem" style="align-items:flex-start;">
      <div class="alertLeft">
        <div class="alertTitle">${a.message}</div>
        <div class="alertMeta"><b>${a.buildingId}</b> • ${a.buildingName || ""}</div>
        <div class="alertMeta">${new Date(a.timestamp).toLocaleString()} • Risk ${a.riskScore}</div>
        <div class="alertMeta">Status: <b>${a.status}</b> • ID: ${a.id}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
        <div class="badgeTag ${sevToPill(a.severity)}">${a.severity}</div>
        <button class="btn" data-ack="${a.id}">Acknowledge</button>
      </div>
    </div>
  `).join("");

  return rows;
}

function renderHistory(){
  const data = DemoStore.getAlerts();
  const list = data.history || [];

  if (!list.length){
    return `<div class="muted">No history yet. Acknowledge a current alert to move it here.</div>`;
  }

  const rows = list.slice().reverse().map(a => `
    <div class="alertItem" style="align-items:flex-start;">
      <div class="alertLeft">
        <div class="alertTitle">${a.message}</div>
        <div class="alertMeta"><b>${a.buildingId}</b> • ${a.buildingName || ""}</div>
        <div class="alertMeta">${new Date(a.timestamp).toLocaleString()} • Risk ${a.riskScore}</div>
        <div class="alertMeta">Resolved: <b>${a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : "—"}</b></div>
      </div>
      <div class="badgeTag safe">RESOLVED</div>
    </div>
  `).join("");

  return rows;
}

function renderRules(){
  const rules = DemoStore.getAlertRules();

  const items = rules.map(r => `
    <div class="impact-card" style="background:var(--card);">
      <h3 style="margin:0 0 6px; font-size:15px;">${r.name}</h3>
      <p style="margin:0; color:var(--muted); line-height:1.5;">
        Condition: <b>${r.condition}</b><br/>
        Severity: <b>${r.severity}</b><br/>
        Action: ${r.action}
      </p>
    </div>
  `).join("");

  return `
    <div class="muted" style="margin-bottom:10px;">
      Demo rules are threshold-based (no backend). In real deployment, rules can be configured per region/building type.
    </div>
    <div class="impact-grid">${items}</div>
  `;
}

function setActiveTab(btnId){
  ["tabCurrent","tabHistory","tabRules"].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove("primary");
  });
  document.getElementById(btnId).classList.add("primary");
}

function mount(html){
  document.getElementById("tabContent").innerHTML = html;

  // wire acknowledge buttons
  document.querySelectorAll("[data-ack]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-ack");
      DemoStore.ackAlert(id);
      // re-render current
      document.getElementById("tabContent").innerHTML = renderCurrent();
      mount(document.getElementById("tabContent").innerHTML);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  DemoStore.ensureAlerts();

  document.getElementById("tabCurrent").addEventListener("click", () => {
    setActiveTab("tabCurrent");
    mount(renderCurrent());
  });
  document.getElementById("tabHistory").addEventListener("click", () => {
    setActiveTab("tabHistory");
    mount(renderHistory());
  });
  document.getElementById("tabRules").addEventListener("click", () => {
    setActiveTab("tabRules");
    mount(renderRules());
  });

  setActiveTab("tabCurrent");
  mount(renderCurrent());
});
