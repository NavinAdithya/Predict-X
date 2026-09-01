# PREDICT-X Dashboard

Autonomous fraud and phishing defense framework with edge-first architecture.

## Quick Start

```bash
npm install
npm run dev
```

## PREDICT-X Fraud Defense Dashboard
3
The **Fraud Defense Dashboard** demonstrates PREDICT-X's core capabilities:

### Accessing the Dashboard

1. Run `npm run dev`
2. Login as **Administrator** (admin@predictx.io / any password)
3. Click on **"Fraud Defense"** in the navigation tabs

### Demo Walkthrough

#### 1. Normal Operation - Safe Users

In the Fraud Defense dashboard:

- Click **"Simulate User A"** button (right panel)
  - User A is classified as SAFE (risk score: 12)
  - Redirected to AWS Academy
  - Behavioral fingerprint captured

- Click **"Simulate User B"** button
  - User B is classified as SAFE (risk score: 18)
  - Redirected to Kyndryl Careers
  - Behavioral fingerprint captured

View the **Safe Redirects** tab to see redirect history with behavioral data.

#### 2. High-Risk Detection with Self-Poisoning

- Click **"Simulate User C"** button
  - User C is flagged as HIGH RISK (score: 97)
  - Factors: impossible travel, typing anomaly
  - Self-poisoning is ACTIVE

View the **High-Risk Alerts** tab:
- Click **"View Poison Stream"** to see corrupted behavioral data
- Enable "Start Live Stream" to watch real-time poisoning
- Click **"View Raw Data"** to see detection factors

#### 3. AWS Outage Simulation (Edge-First Resilience)

1. Go to **Resilience** tab
2. Toggle **"Simulate AWS Outage"** ON
   - Status turns red: "Edge-Only Mode"
   - 47 events are queued for sync
   
3. Try simulating users during outage
   - Events go to pending queue, not main logs
   
4. Click **"Sync Now"** button
   - Queued events sync to main logs
   - Status returns to "Cloud Connected"

### Key Features

| Feature | Description |
|---------|-------------|
| Live Sessions | Real-time session monitoring with auto-refresh every 3s |
| Safe Redirects | Partner site redirects with behavioral fingerprint storage |
| High-Risk Alerts | Admin-only alerts with self-poisoning visualization |
| Resilience | AWS outage simulation with queue management |
| Demo Controls | Simulate user scenarios for testing |

### Architecture Notes

- **Frontend Mock**: All data is stored in React state (`src/services/predictXData.js`)
- **Real-time Updates**: Live sessions update every 3 seconds
- **Self-Poisoning**: Corrupted behavioral data injected for high-risk sessions
- **Edge Mode**: Local detection continues during cloud outage, events queued

## Testing Credentials

### Test Users

Use these email formats to test different scenarios:

| User Type | Email Example | Behavior |
|-----------|---------------|----------|
| Safe User | `safe1@company.com` | SAFE classification → Redirected to Kyndryl |
| Safe User | `user_a@company.com` | SAFE classification → Redirected to Kyndryl |
| Critical | `critical@company.com` | HIGH RISK classification → Admin notified, self-poisoning active |
| Critical | `attacker@hacker.com` | HIGH RISK classification → Admin notified, self-poisoning active |
| Medium | `anyother@email.com` | Medium risk → Monitoring message |

### How It Works

1. **Login as User** (select "End User" role)
2. Enter email to test classification:
   - `safe1@company.com` or `user_a@company.com` → Safe → Redirected to Kyndryl
   - `critical@company.com` or `attacker@hacker.com` → High Risk → Admin notified, data stored
   - Any other email → Medium risk

3. **Check Admin Dashboard**:
   - Login as Administrator (`admin@predictx.io`)
   - Click "Fraud Defense" tab
   - View Live Sessions, Safe Redirects, and High-Risk Alerts

## Existing Features

The app also includes the original cybersecurity dashboard:
- Overview & Threat Monitoring
- Honeypot & Deception Layer
- Cognitive Analysis & Agentic AI
- Flag & Rule Engine
- Forensics & Chain of Custody
- Global Intelligence
- XAI & Report Summarization
- ClawdBot AI Assistant
