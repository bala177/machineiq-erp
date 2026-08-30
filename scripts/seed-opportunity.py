#!/usr/bin/env python3
"""seed-opportunity.py — Wipe existing opportunities then seed 5 realistic ones.

Usage:
  python3 seed-opportunity.py            # wipe + seed (default)
  python3 seed-opportunity.py --clean    # wipe only, no seed
  python3 seed-opportunity.py [base_url] # custom API base
"""
import sys, json, urllib.request, urllib.error

args = sys.argv[1:]
CLEAN_ONLY = "--clean" in args
args = [a for a in args if a != "--clean"]
BASE = (args[0] if args else "http://localhost:4051/api").rstrip("/")

def api(method, path, body=None, token=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        print(f"  ERROR {method} {path}: HTTP {e.code} — {msg[:300]}", file=sys.stderr)
        sys.exit(1)

def post(path, body, token): return api("POST", path, body, token)
def patch(path, body, token): return api("PATCH", path, body, token)

def photo(opp_id, url, caption, kind, token):
    post(f"/opportunities/{opp_id}/photos", {"url": url, "caption": caption, "kind": kind}, token)

def discuss(opp_id, typ, date, content, token, ext=None, open_q=False):
    post(f"/opportunities/{opp_id}/discussion", {
        "type": typ, "date": date, "content": content,
        "externalParticipants": ext or [], "isOpenQuestion": open_q
    }, token)

def review(opp_id, reviewer_id, token, feasibility=None, complexity=None, risk=None):
    body = {"assignedReviewer": reviewer_id}
    if feasibility: body["feasibilityNotes"] = feasibility
    if complexity:  body["complexityNotes"] = complexity
    if risk:        body["riskNotes"] = risk
    patch(f"/opportunities/{opp_id}/review", body, token)

def advance(opp_id, status, token):
    patch(f"/opportunities/{opp_id}/status", {"status": status}, token)

# ── Auth ──────────────────────────────────────────────────────────────────────
print("→ Authenticating …")
resp = post("/auth/login", {"email": "admin@machineiq.com", "password": "password123"}, None)
TOKEN = resp.get("access_token") or resp.get("token")
if not TOKEN:
    print("ERROR: Login failed", file=sys.stderr); sys.exit(1)
print("  ✓ Authenticated")

# ── Wipe existing opportunities ───────────────────────────────────────────────
print("→ Fetching existing opportunities …")
existing = api("GET", "/opportunities", token=TOKEN)
if existing:
    print(f"  Deleting {len(existing)} existing opportunit{'y' if len(existing)==1 else 'ies'} …")
    for opp in existing:
        api("DELETE", f"/opportunities/{opp['_id']}", token=TOKEN)
    print(f"  ✓ Cleared")
else:
    print("  ✓ Nothing to clear")

if CLEAN_ONLY:
    print("\nDone — database cleared (--clean mode).")
    sys.exit(0)

# ── Users ─────────────────────────────────────────────────────────────────────
print("→ Fetching users …")
users = api("GET", "/users", token=TOKEN)
user_map = {u["email"]: u["_id"] for u in users}
print(f"  ✓ {len(users)} users loaded")

# ── Customers ─────────────────────────────────────────────────────────────────
print("→ Fetching customers …")
customers = api("GET", "/customers", token=TOKEN)
if not customers:
    print("ERROR: No customers. Run ./seed.sh first.", file=sys.stderr); sys.exit(1)
C1 = customers[0]["_id"];  C1_NAME = customers[0]["name"]
C2 = customers[1]["_id"] if len(customers) > 1 else C1
C2_NAME = customers[1]["name"] if len(customers) > 1 else C1_NAME
print(f"  ✓ Customer 1: {C1_NAME}")
print(f"  ✓ Customer 2: {C2_NAME}")

print("\n" + "═"*60)
print("  Seeding 5 opportunities …")
print("═"*60)

# ═════════════════════════════════════════════════════════════════════════════
# OPP 1 — New Build · Foundry · Decoring Machine · under_review
# ═════════════════════════════════════════════════════════════════════════════
print("\n[1/5] New Build — Al Casting Decoring Machine (Foundry) → under_review")
r = post("/opportunities", {
    "title": "Al Casting Decoring Machine — 30 s Cycle",
    "customerId": C1,
    "endCustomer": "Bharat Forge Ltd",
    "machineCondition": "new",
    "machineVertical": "foundry",
    "machineCategory": "Decoring Machine",
    "buildType": "new",
    "quantity": "2",
    "inquirySource": "rfq",
    "priority": "high",
    "machinePurpose": "Vibratory decoring machine to remove sand cores from aluminium cylinder block castings after die casting. Handles LH and RH variants on the same fixture.",
    "objectType": "Aluminium cylinder block casting",
    "sizeRange": "420 x 280 x 180 mm",
    "weightRange": "8-12 kg",
    "componentMaterial": "al_casting",
    "targetIndustry": "automotive",
    "variability": "multiple",
    "primaryOperation": "Vibratory sand core removal",
    "processType": "discrete",
    "processSummary": "Cast part loaded onto fixture. Vibratory table actuates at 50 Hz for 20 s. Residual sand exits through chute. Part unloaded manually.",
    "automationLevel": "semi_auto",
    "machineLayout": "inline",
    "availableSpace": "2500 x 1800 mm floor area, 2200 mm height",
    "accessRequirement": "both",
    "estimatedModules": ["vibratory_table", "fixture", "sand_collection", "control_panel"],
    "complexityLevel": "medium",
    "humanInteraction": "medium",
    "targetOutput": "30 s cycle time per part, min 80 parts/hour",
    "operationMode": "cycle_based",
    "accuracyRequirement": "Sand removal >95% per cycle; no surface damage to casting",
    "repeatabilityNeeded": True,
    "qualityCheckNeeded": True,
    "environment": "dust",
    "environmentNotes": "High ambient dust and sand. All electrical enclosures IP54. Cable chains for all moving axes.",
    "operatingHoursPerDay": 16,
    "dutyCycle": "heavy",
    "powerAvailable": "415V 3-phase 50Hz, 32A",
    "airAvailable": "yes",
    "otherUtilities": "Sand collection bin emptied every 2 hours by operator",
    "budgetRange": "10_25L",
    "standardsCompliance": ["CE", "IS 13252"],
    "preferredTechnology": "Pneumatic vibratory with servo-controlled clamping",
    "integrationRequired": False,
    "newConcept": False,
    "unclearAreas": "LH/RH fixture changeover time target not yet confirmed by customer",
    "dependency": "Customer to provide final casting drawing and sand core layout by 10-May-2026",
    "customerContact": "Rajesh Sharma +91-98765-43210",
    "internalOwner": "James Wilson",
    "siteVisitStatus": "planned",
    "customerDrawingStatus": "pending",
    "criticalSpec": "30 s cycle time, 50 Hz vibration, 95% core removal efficiency",
    "deliveryTargetDate": "2026-11-30"
}, TOKEN)
OPP1 = r["_id"]
advance(OPP1, "new", TOKEN)
review(OPP1, user_map.get("james@machineiq.com", user_map.get("admin@machineiq.com")), TOKEN)
advance(OPP1, "under_review", TOKEN)

photo(OPP1, "https://placehold.co/800x600/e2e8f0/475569?text=Casting+Drawing+Rev3",
      "Cylinder block casting drawing Rev.3 from Bharat Forge", "sketch", TOKEN)
photo(OPP1, "https://placehold.co/800x600/fef3c7/92400e?text=Sand+Core+Layout",
      "Sand core layout showing 4 cores per block", "reference", TOKEN)
photo(OPP1, "https://placehold.co/800x600/dcfce7/166534?text=Site+Photo+Line",
      "Existing line layout at Bharat Forge Pune Plant 2", "photo", TOKEN)

discuss(OPP1, "call", "2026-04-10T09:30:00Z",
    "<p><strong>With:</strong> Rajesh Sharma (Bharat Forge)</p>"
    "<p>Rajesh confirmed 2 machines needed for Plant 2 expansion. Cycle time target is firm at 30 s. "
    "RFQ to be sent by end of April. Drawings still under revision — Rev.3 expected 10-May.</p>",
    TOKEN, ["Rajesh Sharma"])

discuss(OPP1, "meeting", "2026-04-15T11:00:00Z",
    "<p><strong>Attendees:</strong> James Wilson, Sarah Johnson, Rajesh Sharma (Bharat Forge)</p>"
    "<p>Kick-off discussion for decoring machine scope:</p>"
    "<ul><li>2 units required, same spec</li>"
    "<li>LH/RH variant handling mandatory — single fixture with flip or two fixtures?</li>"
    "<li>Sand collection below machine, forklift access needed</li></ul>"
    "<p><strong>Action items:</strong></p>"
    "<ul><li>Macpro to propose fixture concept — by 22-Apr</li>"
    "<li>Customer to confirm floor-loading limit — by 20-Apr</li></ul>",
    TOKEN, ["Rajesh Sharma"])

discuss(OPP1, "question", "2026-04-18T14:00:00Z",
    "<p>Is the 30-second cycle time measured from part-load to part-unload, or from vibratory start to end only? "
    "This affects clamp actuation budget and overall machine footprint estimate.</p>"
    "<p><strong>For:</strong> Rajesh Sharma / Bharat Forge</p>",
    TOKEN, [], True)

discuss(OPP1, "note", "2026-04-20T10:00:00Z",
    "<p>Internal scope: 2-ton vibratory table (50 Hz), servo clamping (2-axis), pneumatic sand gate. "
    "Estimated frame weight ~800 kg. Floor loading should be checked against customer spec.</p>",
    TOKEN)

discuss(OPP1, "email", "2026-04-22T08:00:00Z",
    "<p><strong>Contact:</strong> r.sharma@bharatforge.com</p>"
    "<p><strong>Subject:</strong> RE: Decoring Machine RFQ — Initial Scope Confirmation</p>"
    "<p>Rajesh confirmed fixture changeover time acceptable up to 15 minutes. Floor loading limit 3 t/m2. "
    "Potential 3rd unit for Plant 3 if pilot machines perform well.</p>",
    TOKEN, ["r.sharma@bharatforge.com"])

print(f"  ✓ OPP 1 created: {OPP1}")

# ═════════════════════════════════════════════════════════════════════════════
# OPP 2 — Existing Machine Retrofit · Machine Shop · Wet LT · approved
# ═════════════════════════════════════════════════════════════════════════════
print("\n[2/5] Existing Machine Retrofit — Wet Leak Test Upgrade (Machine Shop) → approved")
r = post("/opportunities", {
    "title": "Wet Leak Test Machine Retrofit — 12 Bar Pressure Upgrade",
    "customerId": C1,
    "endCustomer": "Cummins India Ltd",
    "machineCondition": "existing",
    "existingMachineChecks": [
        {"item": "Existing machine drawings available", "checked": True,  "note": "Rev.7 drawings received, dated 2021"},
        {"item": "Electrical panel accessible for retrofit", "checked": True,  "note": "Siemens S7-300 PLC, room for new I/O modules"},
        {"item": "Hydraulic/pneumatic circuits documented", "checked": False, "note": "Pneumatic circuit drawing missing — customer to provide"},
        {"item": "Machine currently in production", "checked": True,  "note": "Running 1 shift, can be taken offline weekends"},
        {"item": "Safety guarding intact", "checked": True,  "note": "CE-marked original guarding, no modifications"}
    ],
    "machineVertical": "machine_shop",
    "machineCategory": "Wet Leak Test Machine",
    "buildType": "retrofit",
    "quantity": "1",
    "inquirySource": "repeat",
    "priority": "high",
    "machinePurpose": "Upgrade existing wet leak test station from 6 bar to 12 bar test pressure to match new ISX engine block specification. Replace test manifold and upgrade pressure intensifier circuit.",
    "objectType": "ISX engine block — cast iron",
    "sizeRange": "580 x 340 x 260 mm",
    "weightRange": "38-42 kg",
    "componentMaterial": "cast_iron",
    "targetIndustry": "automotive",
    "variability": "single",
    "primaryOperation": "Hydrostatic pressure leak test at 12 bar",
    "processType": "discrete",
    "processSummary": "Block loaded onto existing fixture. New high-pressure manifold seals 6 ports. Pressure intensifier builds to 12 bar in <=8 s. Hold for 15 s. Pass/fail logged to MES.",
    "automationLevel": "fully_auto",
    "machineLayout": "inline",
    "availableSpace": "Existing machine footprint — no floor space change allowed",
    "accessRequirement": "maintenance",
    "complexityLevel": "medium",
    "humanInteraction": "low",
    "targetOutput": "Cycle time <=45 s including load/unload",
    "operationMode": "cycle_based",
    "accuracyRequirement": "Test pressure +/-0.1 bar; leak threshold <0.05 bar/15 s drop",
    "repeatabilityNeeded": True,
    "qualityCheckNeeded": True,
    "environment": "wet",
    "environmentNotes": "Water-based test fluid with rust inhibitor. Existing drip trays and drain system reused.",
    "operatingHoursPerDay": 8,
    "dutyCycle": "medium",
    "powerAvailable": "Existing 415V 3-phase, 20A spare capacity confirmed",
    "airAvailable": "yes",
    "otherUtilities": "Plant water supply at 3 bar available for intensifier pre-fill",
    "budgetRange": "5_10L",
    "standardsCompliance": ["IS 15614"],
    "preferredTechnology": "Existing Siemens S7-300 PLC retained; new KTP900 HMI",
    "integrationRequired": True,
    "integrationNotes": "MES integration via OPC-UA required — same protocol as existing machine",
    "newConcept": False,
    "customerContact": "Anil Menon — Cummins India +91-97700-11223",
    "internalOwner": "Admin User",
    "siteVisitStatus": "yes",
    "customerDrawingStatus": "yes",
    "criticalSpec": "12 bar test pressure, +/-0.1 bar accuracy, <=45 s cycle",
    "deliveryTargetDate": "2026-08-15"
}, TOKEN)
OPP2 = r["_id"]
admin_id = user_map.get("james@machineiq.com") or user_map.get("admin@machineiq.com")
advance(OPP2, "new", TOKEN)
review(OPP2, admin_id, TOKEN)                         # assign reviewer (no notes yet)
advance(OPP2, "under_review", TOKEN)                  # now under review
review(OPP2, admin_id, TOKEN,                         # add review notes
    feasibility="Feasible — existing PLC and electrical panel are compatible. Manifold replacement is straightforward mechanical work. No new guarding required.",
    complexity="Medium complexity. PLC extension and new HMI require software work. Manifold block needs re-machining from certified drawing. MES OPC-UA integration tested on original machine.",
    risk="Low risk overall. Main risk: pneumatic circuit drawing missing — if circuit has been modified informally, re-validation will be needed. Mitigated by site visit confirmation."
)
advance(OPP2, "feasibility_in_progress", TOKEN)
advance(OPP2, "approved", TOKEN)

photo(OPP2, "https://placehold.co/800x600/dbeafe/1e40af?text=Existing+Machine+Photo",
      "Existing wet leak test machine at Cummins Pune — front view", "photo", TOKEN)
photo(OPP2, "https://placehold.co/800x600/e0e7ff/3730a3?text=PLC+Panel+Inside",
      "Siemens S7-300 panel — I/O expansion slots highlighted", "reference", TOKEN)
photo(OPP2, "https://placehold.co/800x600/f0fdf4/15803d?text=ISX+Block+Drawing",
      "ISX engine block with 6 test port locations marked", "sketch", TOKEN)

discuss(OPP2, "call", "2026-03-05T10:00:00Z",
    "<p><strong>With:</strong> Anil Menon (Cummins India)</p>"
    "<p>Repeat customer — they have run our Wet LT machine since 2021. New ISX block spec requires "
    "12 bar vs current 6 bar. Anil confirmed budget is approved internally. Site visit can be arranged any working day.</p>",
    TOKEN, ["Anil Menon"])

discuss(OPP2, "meeting", "2026-03-18T09:00:00Z",
    "<p><strong>Attendees:</strong> Admin User, James Wilson, Anil Menon, Plant Engineer (Cummins)</p>"
    "<p>Site visit to Cummins Pune. Key findings:</p>"
    "<ul><li>Existing machine in good mechanical condition</li>"
    "<li>PLC program can be extended — no full rewrite needed</li>"
    "<li>Manifold must be completely replaced — port spacing changes for ISX block</li>"
    "<li>No floor space change permitted</li></ul>"
    "<p><strong>Action items:</strong></p>"
    "<ul><li>Macpro to quote manifold replacement + intensifier upgrade</li>"
    "<li>Cummins to share MES OPC-UA tag list</li></ul>",
    TOKEN, ["Anil Menon", "Cummins Plant Engineer"])

discuss(OPP2, "decision", "2026-04-02T00:00:00Z",
    "<p><strong>Decision:</strong> Retain existing S7-300 PLC and add EM226 analog I/O expansion module "
    "for pressure transducer signals. Replace HMI with Siemens KTP900 Basic.</p>"
    "<p><strong>Why:</strong> New PLC would require MES re-integration at significant cost. "
    "Existing PLC has sufficient capacity.</p>"
    "<p><strong>By:</strong> Admin User (Macpro) and Anil Menon (Cummins)</p>",
    TOKEN)

discuss(OPP2, "email", "2026-04-10T07:30:00Z",
    "<p><strong>Contact:</strong> anil.menon@cummins.com</p>"
    "<p><strong>Subject:</strong> PO Approval — Wet LT Retrofit</p>"
    "<p>Anil confirmed PO has been raised internally. Formal PO document to be emailed by end of week. "
    "Requested delivery by 15-Aug to align with ISX block production start date.</p>",
    TOKEN, ["anil.menon@cummins.com"])

print(f"  ✓ OPP 2 created: {OPP2}")

# ═════════════════════════════════════════════════════════════════════════════
# OPP 3 — New Build · SPM · 180 Ton Press · feasibility_in_progress
# ═════════════════════════════════════════════════════════════════════════════
print("\n[3/5] New Build — 180 Ton Hydraulic Press (SPM) → feasibility_in_progress")
r = post("/opportunities", {
    "title": "180 Ton Hydraulic Press — Rubber Seal Press-fit Line",
    "customerId": C2,
    "endCustomer": "Apollo Tyres Ltd",
    "machineCondition": "new",
    "machineVertical": "spm",
    "machineCategory": "180 Ton Press",
    "buildType": "new",
    "quantity": "1",
    "inquirySource": "site_visit",
    "priority": "critical",
    "machinePurpose": "180-ton hydraulic press for press-fitting rubber seals into steel housings for axle assembly line. Inline integration with conveyor — no manual loading.",
    "objectType": "Steel axle housing with rubber seal cavity",
    "sizeRange": "260 x 190 mm (seal cavity)",
    "weightRange": "12-18 kg",
    "componentMaterial": "rubber",
    "targetIndustry": "automotive",
    "variability": "multiple",
    "primaryOperation": "Press-fit rubber seal into housing cavity",
    "processType": "discrete",
    "processSummary": "Housing arrives on conveyor. Robot loads onto press fixture. Seal fed from bowl feeder onto alignment jig. Press descends at controlled force ramp — 0 to 120 T over 80 mm stroke. Force-displacement curve logged per part.",
    "automationLevel": "fully_auto",
    "machineLayout": "inline",
    "availableSpace": "3200 x 2000 mm, height 2800 mm",
    "accessRequirement": "both",
    "estimatedModules": ["hydraulic_press", "robot_loader", "bowl_feeder", "fixture", "force_monitoring", "conveyor_interface", "control_panel"],
    "complexityLevel": "high",
    "humanInteraction": "low",
    "targetOutput": "20 s cycle time; 150 parts/hour; Cpk >=1.67 on press force",
    "operationMode": "cycle_based",
    "accuracyRequirement": "Force accuracy +/-2%; position accuracy +/-0.05 mm at BDC",
    "repeatabilityNeeded": True,
    "qualityCheckNeeded": True,
    "environment": "normal",
    "operatingHoursPerDay": 20,
    "dutyCycle": "heavy",
    "powerAvailable": "415V 3-phase, 63A dedicated",
    "airAvailable": "yes",
    "otherUtilities": "Hydraulic power unit built-in; nitrogen accumulator for fast return",
    "budgetRange": "50L_plus",
    "standardsCompliance": ["CE", "ISO 4413"],
    "preferredTechnology": "Servo-hydraulic with proportional valve and inline load cell",
    "integrationRequired": True,
    "integrationNotes": "Integration with Apollo line PLC (Rockwell L82) via Ethernet/IP. Conveyor stop/start signals mandatory.",
    "newConcept": False,
    "unclearAreas": "Robot make/model not yet decided by Apollo. Bowl feeder design depends on final seal geometry.",
    "dependency": "Apollo to finalise seal drawing Rev.4 and robot vendor selection by 30-Apr-2026",
    "customerContact": "Dinesh Rao — Apollo Tyres +91-99001-55678",
    "internalOwner": "James Wilson",
    "siteVisitStatus": "yes",
    "customerDrawingStatus": "pending",
    "criticalSpec": "180 T capacity, 20 s cycle, Cpk >=1.67, force-displacement logging per part",
    "deliveryTargetDate": "2027-02-28"
}, TOKEN)
OPP3 = r["_id"]
reviewer_id = user_map.get("james@machineiq.com") or user_map.get("admin@machineiq.com")
advance(OPP3, "new", TOKEN)
review(OPP3, reviewer_id, TOKEN)             # assign reviewer
advance(OPP3, "under_review", TOKEN)
advance(OPP3, "feasibility_in_progress", TOKEN)

photo(OPP3, "https://placehold.co/800x600/fce7f3/9d174d?text=Line+Layout+Sketch",
      "Apollo axle assembly line layout sketch — press location marked", "sketch", TOKEN)
photo(OPP3, "https://placehold.co/800x600/ffe4e6/be123c?text=Seal+Section+Drawing",
      "Rubber seal cross-section — cavity interference fit dimensions", "sketch", TOKEN)

discuss(OPP3, "meeting", "2026-04-05T10:00:00Z",
    "<p><strong>Attendees:</strong> James Wilson, Admin User, Dinesh Rao, Production Manager (Apollo)</p>"
    "<p>Site visit to Apollo Tyres Perambur plant. Observed existing manual press-fit — 2 operators, "
    "high ergonomic risk. Quality rejections ~3% due to misalignment.</p>"
    "<ul><li>Full automation mandatory — operator only for reject removal</li>"
    "<li>Force-displacement curve must be logged per part for SPC</li>"
    "<li>Rockwell PLC integration via Ethernet/IP confirmed</li></ul>",
    TOKEN, ["Dinesh Rao", "Apollo Production Manager"])

discuss(OPP3, "question", "2026-04-12T00:00:00Z",
    "<p>Does Apollo require SPC data stored locally on machine HMI, or only transmitted to MES? "
    "This affects HMI spec and local storage requirement.</p>"
    "<p><strong>For:</strong> Dinesh Rao / Apollo Tyres</p>",
    TOKEN, [], True)

discuss(OPP3, "note", "2026-04-20T00:00:00Z",
    "<p>Internal feasibility: 180T servo-hydraulic confirmed achievable within budget. "
    "Key risk is bowl feeder design — rubber seals may require special tooling to avoid distortion. "
    "Robot: Fanuc R-2000iC/165F tentatively selected pending Apollo confirmation.</p>",
    TOKEN)

print(f"  ✓ OPP 3 created: {OPP3}")

# ═════════════════════════════════════════════════════════════════════════════
# OPP 4 — Clone · Machine Shop · EOL Tester x3 · new
# ═════════════════════════════════════════════════════════════════════════════
print("\n[4/5] Clone Order — EOL Tester x3 (Machine Shop) → new")
r = post("/opportunities", {
    "title": "EOL Tester Clone x3 — Gear Housing Production Expansion",
    "customerId": C2,
    "endCustomer": "Mahindra & Mahindra Ltd",
    "machineCondition": "existing",
    "existingMachineChecks": [
        {"item": "Original machine drawings available", "checked": True, "note": "Full drawing set Rev.5 in Macpro archive"},
        {"item": "BOM available for clone", "checked": True, "note": "BOM locked — all components still available from same vendors"},
        {"item": "Software/PLC program backed up", "checked": True, "note": "Backed up Oct 2025 — no changes since"},
        {"item": "Original machine still operational for reference", "checked": True, "note": "M&M can allow Macpro team access for dimensional checks"},
        {"item": "Any spec changes for new units", "checked": False, "note": "M&M requesting 4th port on test manifold — needs drawing update"}
    ],
    "machineVertical": "machine_shop",
    "machineCategory": "EOL Tester",
    "buildType": "clone",
    "quantity": "3_5",
    "inquirySource": "repeat",
    "priority": "high",
    "machinePurpose": "Clone of existing EOL tester (MIQ-EOL-2023-001) for gear housing final test. M&M expanding from 1 to 3 lines at Nashik plant. Minor spec addition: 4th test port on manifold.",
    "objectType": "Gear housing — cast aluminium",
    "sizeRange": "320 x 240 x 180 mm",
    "weightRange": "5-9 kg",
    "componentMaterial": "al_casting",
    "targetIndustry": "automotive",
    "variability": "single",
    "primaryOperation": "End-of-line functional test — leak, torque, NVH",
    "processType": "discrete",
    "processSummary": "Housing loaded. 4-port manifold seals. Leak test at 2 bar dry air. Torque test on output shaft. NVH vibration signature captured. Pass/fail + trace data uploaded to MES.",
    "automationLevel": "semi_auto",
    "complexityLevel": "medium",
    "humanInteraction": "medium",
    "targetOutput": "60 s cycle time per unit (same as original)",
    "operationMode": "cycle_based",
    "repeatabilityNeeded": True,
    "qualityCheckNeeded": True,
    "environment": "normal",
    "operatingHoursPerDay": 16,
    "dutyCycle": "medium",
    "powerAvailable": "415V 3-phase 50Hz, 16A per machine",
    "airAvailable": "yes",
    "budgetRange": "25_50L",
    "standardsCompliance": ["CE"],
    "preferredTechnology": "Same as original — Siemens S7-1200, KTP700 HMI",
    "integrationRequired": True,
    "integrationNotes": "Same OPC-UA to M&M MES as original — only IP addresses change",
    "newConcept": False,
    "unclearAreas": "4th port addition: M&M to confirm port location on gear housing drawing before Macpro updates manifold design",
    "customerContact": "Suresh Iyer — M&M Nashik +91-94221-88990",
    "internalOwner": "Admin User",
    "siteVisitStatus": "no",
    "customerDrawingStatus": "yes",
    "criticalSpec": "Clone of MIQ-EOL-2023-001 + 4th test port; 60 s cycle; MES OPC-UA integration",
    "deliveryTargetDate": "2026-12-31"
}, TOKEN)
OPP4 = r["_id"]
advance(OPP4, "new", TOKEN)
# OPP4 stays at 'new' — early stage, no reviewer assigned yet

photo(OPP4, "https://placehold.co/800x600/f0fdf4/166534?text=Original+EOL+Tester",
      "Original EOL Tester MIQ-EOL-2023-001 — front view at M&M Nashik", "photo", TOKEN)
photo(OPP4, "https://placehold.co/800x600/ecfdf5/065f46?text=4th+Port+Markup",
      "Customer markup on gear housing drawing — requested 4th test port location", "sketch", TOKEN)

discuss(OPP4, "email", "2026-04-08T09:00:00Z",
    "<p><strong>Contact:</strong> suresh.iyer@mahindra.com</p>"
    "<p><strong>Subject:</strong> EOL Tester Repeat Order — Nashik Plant Expansion</p>"
    "<p>Suresh confirmed 3 additional units required for Lines 4, 5, and 6 at Nashik. "
    "Same spec as original with one addition — 4th test port. PO to follow once drawing is updated "
    "and Macpro confirms price revision.</p>",
    TOKEN, ["suresh.iyer@mahindra.com"])

discuss(OPP4, "note", "2026-04-15T00:00:00Z",
    "<p>Internal: Clone BOM reviewed — all vendor parts available, 6-8 week lead time. "
    "4th port addition requires manifold block re-machining only — no structural changes. "
    "Estimated price uplift Rs.40,000 per unit. Drawing update assigned to Mechanical team.</p>",
    TOKEN)

discuss(OPP4, "question", "2026-04-22T00:00:00Z",
    "<p>Does M&M want all 3 machines delivered simultaneously or can we deliver in 2 batches "
    "(2 units + 1 unit) to match their line commissioning schedule? Batch delivery could reduce "
    "lead time for first two machines by ~3 weeks.</p>"
    "<p><strong>For:</strong> Suresh Iyer / M&M</p>",
    TOKEN, [], True)

print(f"  ✓ OPP 4 created: {OPP4}")

# ═════════════════════════════════════════════════════════════════════════════
# OPP 5 — New Build · Fabrication · Pallet Lifter · draft
# ═════════════════════════════════════════════════════════════════════════════
print("\n[5/5] New Build — Pallet Lifter (Fabrication) → draft")
r = post("/opportunities", {
    "title": "Pallet Lifter — Assembly Line Buffer Station",
    "customerId": C1,
    "machineCondition": "new",
    "machineVertical": "fabrication",
    "machineCategory": "Pallet Lifter",
    "buildType": "new",
    "quantity": "2",
    "inquirySource": "phone",
    "priority": "low",
    "machinePurpose": "Fabricated pallet lifting structure for assembly line buffer station. Lift height 600 mm, manual scissor lift with safety lock.",
    "targetOutput": "Manual operation — no cycle time requirement",
    "operationMode": "continuous",
    "budgetRange": "lt_5L",
    "siteVisitStatus": "no",
    "customerDrawingStatus": "no",
    "deliveryTargetDate": "2026-09-30"
}, TOKEN)
OPP5 = r["_id"]

discuss(OPP5, "call", "2026-04-21T16:00:00Z",
    "<p><strong>With:</strong> Purchase Manager (customer)</p>"
    "<p>Brief call — customer needs 2 scissor-lift pallet stations for assembly line rearrangement. "
    "No drawings yet. Will send requirements by email next week. Very early stage.</p>",
    TOKEN)

print(f"  ✓ OPP 5 created: {OPP5}")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print(" Seed complete — 5 opportunities created")
print("="*60)
rows = [
    ("review", "Al Casting Decoring Machine", "Foundry / Decoring",    OPP1),
    ("apprvd", "Wet Leak Test Retrofit",       "Machine Shop / Wet LT", OPP2),
    ("feasib", "180 Ton Hydraulic Press",      "SPM / 180T Press",      OPP3),
    ("new",    "EOL Tester Clone x3",          "Machine Shop / EOL",    OPP4),
    ("draft",  "Pallet Lifter",                "Fabrication / Lifter",  OPP5),
]
print(f"\n {'Status':<8} {'Title':<36} {'Vertical':<24} URL")
print(f" {'------':<8} {'-----':<36} {'--------':<24} ---")
for status, title, vertical, oid in rows:
    print(f" {status:<8} {title:<36} {vertical:<24} http://localhost:4050/opportunities/{oid}")
print()
