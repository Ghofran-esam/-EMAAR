# Invisible Damage Mapper (IDM)
### Quantum-Enhanced Early Collapse Risk Mapping — Prototype

**Invisible Damage Mapper (IDM)** is a front-end decision-support prototype designed to assess **hidden structural damage** in buildings after bombardment or extreme vibration events.  
Instead of relying on visible cracks, IDM analyzes **changes in structural behavior** (vibrations, acoustic emissions, and their evolution over time) and converts them into a clear, human-readable decision:

🟢 **Safe** | 🟡 **Monitor** | 🔴 **Evacuate**

This prototype is tailored for **post-strike environments** (e.g., Gaza), where fast, resource-aware decisions are critical.

---

## Core Idea
Many buildings remain standing after an attack but suffer **internal, invisible damage** that may lead to **delayed collapse** days or weeks later.  
IDM detects this *silent risk* by monitoring how a building’s **vibration and acoustic signature changes over time**, rather than searching for visible cracks.

> *We don’t look for cracks — we detect signature change under uncertainty.*

---

## How It Works (High Level)
1. **Signals**
   - Micro-vibrations (resonance shifts Δf/f)
   - Acoustic emission pulses (micro-cracks)
   - Trend acceleration over time

2. **AI + Quantum-Assisted Logic (Demo)**
   - AI performs denoising and feature extraction
   - Quantum-inspired logic improves robustness under high noise (demo mode)

3. **Decision Output**
   - Risk score (0–100)
   - Discrete decision: Safe / Monitor / Evacuate
   - Visualized on dashboards and a geographic risk map

---

## How to Run the Prototype
1. Open `index.html` in a modern browser (Chrome recommended).
2. Click **Run Demo Scenario** to generate simulated buildings, sensors, and alerts.
3. Click **Open Control Center** to access:
   - Dashboard
   - Risk Map
   - Building details
   - Sensors
   - Analytics
   - Alerts Center

No backend or installation is required.

---

## Demo Mode & Local Storage
This prototype runs entirely in **demo mode** using browser `localStorage`.

Key stored objects:
- `IDM_DEMO_DATA` — buildings, risk scores, trends, alerts
- `IDM_SENSORS` — simulated sensor network
- `IDM_SELECTED_BUILDING` — currently selected building
- `IDM_ALERTS_DB` — alerts history
- `IDM_INSPECTED_IDS` — inspected buildings

This allows full interaction without any server.

---

## CDN Dependencies
The prototype uses public CDNs (internet required):
- **Leaflet.js** — interactive maps
- **Chart.js** — analytics and signal visualization

No external APIs or private keys are used.

---

## Project Structure
- `index.html` (landing + demo generator)
- `css/styles.css` (UI theme + components)
- `js/data.js` (DemoStore: data layer + simulation + alerts)
- `damage-mapper/dashboard.html` + `js/dashboard.js`
- `damage-mapper/map.html` + `js/map.js`
- `damage-mapper/building.html` + `js/building.js`
- `damage-mapper/analytics.html` + `js/analytics.js`
- `damage-mapper/alerts.html` + `js/alerts.js`
- `damage-mapper/sensors.html` + `js/sensors.js`
---

## Design Principles
- **Explainability first** — every risk decision includes human-readable drivers
- **Resource-aware** — lightweight, browser-based, no backend
- **Modular UI** — clear separation between data, logic, and visualization
- **Noise-robust logic** — trends and patterns over single thresholds

---

## Known Limitations
- This is a **prototype**: all sensor data is simulated (no real hardware integration yet).
- Risk scoring is **illustrative**, not a certified structural engineering diagnosis.
- Quantum sensing and QML are represented conceptually and through demo logic, not physical quantum hardware.

---

## Future Work
- Integrate real sensor streaming (IoT / edge devices) with a backend API.
- Replace demo scoring with trained ML / QML models using real datasets.
- Add per-building calibration, structural typology awareness, and automated PDF reporting.
- Support city-scale deployment and multi-agency access.

---

## Impact
Invisible Damage Mapper aims to:
- Reduce deaths from delayed building collapses
- Support fast post-strike safety decisions
- Guide emergency responders to the highest-risk locations
- Provide a scalable foundation for post-disaster structural monitoring

---

**Invisible Damage Mapper — detecting risk before collapse.**
