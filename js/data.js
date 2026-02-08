// data.js (BOOTSTRAP ONLY)
// ترتيب <script> مهم: store.js -> risk.js -> sensorsStore.js -> alertsStore.js -> data.js

(function () {
  // 1) load raw + adapt
  const raw = window.IDM_Store.ensureDemoData();
  const state = window.IDM_Store.adapt(raw);

  // 2) ensure buildings exist (حتى لو raw فاضي)
  window.IDM_Store.ensureBuildings(state);

  // 3) attach sensors
  window.IDM_SensorsStore.ensureSensors(state);

  // 4) ensure alerts db exists
  window.IDM_AlertsStore.ensureAlerts(state);

  // 5) expose DemoStore (API واحد موحّد لكل الصفحات)
  window.DemoStore = {
    state,

    // risk + confidence
    computeRisk: (building, mode = "CLASSICAL") => window.IDM_Risk.computeRisk(building, mode),
    computeConfidence: (building, mode = "CLASSICAL") => window.IDM_Risk.computeConfidence(building, mode),

    // analytics helpers
    getZoneStats: (mode = "CLASSICAL") => window.IDM_Risk.getZoneStats(state, mode),
    getRiskDrivers: (mode = "CLASSICAL") => window.IDM_Risk.getRiskDrivers(state, mode),
    getConfidenceHist: (mode = "CLASSICAL") => window.IDM_Risk.getConfidenceHist(state, mode),
    getCompareSeries: () => window.IDM_Risk.getCompareSeries(state),

    // simulate tick (buildings + sensors)
    simulateTick: () => window.IDM_Store.simulateTick(state),

    // sensors
    ensureSensors: () => window.IDM_SensorsStore.ensureSensors(state),

    // alerts
    ensureAlerts: () => window.IDM_AlertsStore.ensureAlerts(state),
    getAlerts: () => window.IDM_AlertsStore.getAlerts(state),
    ackAlert: (id) => window.IDM_AlertsStore.ackAlert(state, id),
    getAlertRules: () => window.IDM_AlertsStore.getAlertRules(state),

    // selection helpers (optional)
    getSelectedBuildingId: () => window.IDM_Store.getSelectedBuildingId(state),
    setSelectedBuildingId: (id) => window.IDM_Store.setSelectedBuildingId(state, id),
  };
})();
