// alertsStore.js
// مسؤول عن: Alerts DB في localStorage + rules + ack/move history

(function () {
  const ALERTS_KEY = "IDM_ALERTS_DB";

  function loadDb() {
    const s = localStorage.getItem(ALERTS_KEY);
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  }

  function saveDb(db) {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(db));
  }

  function defaultRules() {
    return [
      { name: "Critical collapse risk", condition: "Risk score ≥ 85", severity: "CRITICAL", action: "Evacuate + engineer inspection" },
      { name: "Warning anomaly trend", condition: "65 ≤ Risk score < 85", severity: "WARNING", action: "Monitor continuously + prepare reinforcement" },
      { name: "Info sensor noise", condition: "Noise score ≥ 0.75", severity: "INFO", action: "Check placement / recalibrate sensor" },
    ];
  }

  function ensureAlerts(state) {
    let db = loadDb();
    if (db) return db;

    const buildings = state.buildings || [];
    const now = Date.now();
    const current = [];

    buildings.forEach((b, i) => {
      const r = window.IDM_Risk.computeRisk(b, "CLASSICAL");
      if (r.score >= 65) {
        current.push({
          id: "AL-" + (now + i),
          severity: (r.score >= 85) ? "CRITICAL" : "WARNING",
          message: (r.score >= 85) ? "High collapse risk detected." : "Significant anomaly trend detected.",
          buildingId: b.id,
          buildingName: b.name,
          riskScore: r.score,
          status: "ACTIVE",
          acknowledged: false,
          timestamp: new Date(now - (i * 9) * 60000).toISOString()
        });
      }
    });

    db = { current, history: [], rules: defaultRules() };
    saveDb(db);
    return db;
  }

  function getAlerts(state) {
    return ensureAlerts(state);
  }

  function ackAlert(state, id) {
    const db = ensureAlerts(state);
    const idx = db.current.findIndex(a => a.id === id);
    if (idx === -1) return;

    const a = db.current.splice(idx, 1)[0];
    a.status = "RESOLVED";
    a.acknowledged = true;
    a.resolvedAt = new Date().toISOString();
    db.history.push(a);
    saveDb(db);
  }

  function getAlertRules(state) {
    const db = ensureAlerts(state);
    return db.rules || defaultRules();
  }

  window.IDM_AlertsStore = {
    ensureAlerts,
    getAlerts,
    ackAlert,
    getAlertRules,
  };
})();
