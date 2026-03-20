# PulseShield

## AI-Powered Opportunity Loss Insurance for Gig Workers

---

## 1. Problem Requirement

Gig workers (Zomato, Swiggy, Amazon, etc.) frequently lose income due to **external disruptions** such as weather, traffic, pollution, and local restrictions. These disruptions reduce their working efficiency and earnings by up to 20–30%, yet there is **no structured insurance system** that protects their *income loss*.

Existing solutions focus only on extreme events, ignoring **daily micro-losses**, which form the majority of financial instability.

---

## 2. Persona-Based Scenario

**Persona:** Food Delivery Partner (Urban Area)

**Scenario:**

- A delivery partner typically earns ₹800/day
- Due to moderate rain and reduced order demand, earnings drop to ₹450
- The worker is active but receives fewer orders

**Traditional insurance** → No payout  
**PulseShield** → Detects income gap and compensates ₹350

**Focus:** Loss of income, not event severity

---

## 3. Solution

**PulseShield** is an AI-powered opportunity loss insurance platform built specifically for gig workers. Instead of only reacting to major disruptions, it continuously estimates how much a worker is expected to earn under normal conditions and compares it with actual earnings during disruption periods.

If a valid earning gap is detected and verified against real-world conditions, the system automatically triggers compensation.

### How the solution works:
- Builds a worker-specific earning and risk profile
- Predicts expected income using AI/ML models
- Monitors external disruptions such as weather, traffic, pollution, and platform demand
- Detects verified income loss in real time
- Triggers automatic claims and simulated instant payouts
- Uses anti-spoofing and fraud detection logic to prevent misuse

This makes PulseShield more practical than traditional insurance because it protects workers from **hidden daily income loss**, not just extreme shutdown events.

---

## 4. Application Workflow

<img width="1350" height="750" alt="image" src="https://github.com/user-attachments/assets/2b51317a-12b8-4b63-86a3-b077b79277f1" />

1. **Onboarding**  
   Worker registers with location, work pattern, and platform

2. **Profile & Risk Modeling**  
   AI builds earning and risk profile

3. **Income Prediction**  
   Predicts expected earnings for a given time period

4. **Real-Time Monitoring**  
   Tracks disruptions (weather, traffic, demand)

5. **Loss Detection**
   Expected Income – Actual Income = Loss

6. **Auto Claim Trigger**
   If threshold met → claim initiated automatically

7. **Instant Payout**
   Compensation credited via UPI (simulated)

---

## 5. Weekly Premium Model

PulseShield follows a **weekly pricing model** aligned with gig workers’ earning cycles.

### Dynamic Pricing Logic

Premium is calculated based on:

* Location risk (flood, pollution zones)
* Earnings variability
* Historical disruption frequency

### Example

| Risk Level  | Weekly Premium | Coverage |
| ----------- | -------------- | -------- |
| Low Risk    | ₹20            | ₹300/day |
| Medium Risk | ₹35            | ₹600/day |
| High Risk   | ₹50            | ₹900/day |

Ensures affordability + personalization

---

## 6. Parametric Triggers

The system uses **predefined measurable conditions** to automate claims:

| Trigger Type       | Condition             | Impact                    |
| ------------------ | --------------------- | ------------------------- |
|  Rainfall       | > 50mm                | Reduced deliveries        |
| Heatwave       | > 40°C                | Lower working hours       |
| Pollution      | AQI > 300             | Unsafe working conditions |
| Traffic         | High congestion index | Fewer trips               |
| Platform Issues | Order drop rate       | Income reduction          |

Combined with income gap detection for accuracy

---

## 7. AI/ML Integration

### Income Prediction Model

* Time-series forecasting
* Predicts expected earnings

### Dynamic Premium Model

* Adjusts weekly pricing based on risk

### Fraud Detection

* GPS validation
* Behavior anomaly detection
* Duplicate claim prevention

AI ensures fairness, accuracy, and automation

---

## 8. Adversarial Defense & Anti-Spoofing Strategy

As fraud syndicates become more sophisticated, PulseShield is designed with a **multi-layer adversarial defense architecture** to differentiate genuine worker distress from coordinated spoofing attempts.

### 8.1 The Differentiation

PulseShield does not rely only on raw GPS coordinates. Instead, it evaluates whether the worker’s claim is consistent with a **real delivery disruption pattern**.

A genuinely stranded delivery partner will usually show:

* movement history consistent with normal delivery activity
* realistic slowdown or stoppage in a disruption-affected zone
* matching external conditions such as rain, traffic, or low demand
* behavior continuity before and after the disruption window

A bad actor spoofing location may show:

* sudden teleport-like jumps between coordinates
* static coordinates with no realistic movement trail
* repeated claims from the same hotspot with inconsistent work behavior
* claim timing that does not match platform demand or disruption signals

The architecture therefore combines **location intelligence + behavioral consistency + external event validation** before approving a payout.

---

### 8.2 The Data

To detect sophisticated fraud rings, PulseShield analyzes multiple signals beyond basic GPS:

* **Route continuity data**
  Checks whether the movement path is realistic for an actual delivery partner

* **Speed and motion patterns**
  Detects impossible movement speeds, sudden jumps, or synthetic stationary behavior

* **Timestamp consistency**
  Verifies whether activity timing matches disruption timing and work schedule

* **Device integrity signals**
  Flags emulator-like behavior, repeated device switching, or suspicious device reuse

* **Network quality indicators**
  Differentiates genuine network drops during storms from intentional signal tampering

* **Delivery activity patterns**
  Compares active hours, order acceptance trends, idle windows, and earnings history

* **Zone-level anomaly clustering**
  Detects multiple accounts claiming loss from the same area in unnatural synchronized patterns

* **Historical claim linkage**
  Identifies repeated cross-account similarities, shared devices, repeated payout destinations, or recurring suspicious zones

This allows the system to detect not only single fraudulent claims, but also signs of a **coordinated fraud ring**.

---

### 8.3 The UX Balance

PulseShield is designed to be secure **without unfairly penalizing honest workers**.

If a claim is flagged, the workflow does **not immediately reject** it. Instead, it follows a tiered handling process:

#### Low-risk flag

* claim may be temporarily held for secondary verification
* system checks additional context such as network drop, weather severity, and recent activity continuity
* if supporting signals are valid, payout proceeds automatically

#### Medium-risk flag

* claim is moved to a soft-review state
* worker is asked for lightweight confirmation such as re-syncing activity or confirming recent work session details
* no long manual form-filling is required

#### High-risk flag

* claim is escalated for admin or insurer review
* payout is paused only when multiple fraud indicators are strongly aligned

### Fairness principle

The system is intentionally designed to use **progressive trust scoring**, so that honest workers facing genuine bad weather or network issues are not blocked by one weak signal alone. A claim is only penalized when several independent fraud indicators point to abuse.

This balances:

* **security for the insurer**
* **fairness for the worker**
* **speed of payout for genuine cases**

---

## 9. Platform Choice (Mobile vs Web)

### Chosen Platform: **Mobile Application**

### Justification

* Gig workers primarily use smartphones
* Real-time tracking and notifications are required
* Instant payout alerts and interaction
* Better accessibility during work hours

Mobile-first approach ensures usability and adoption

---

## 10. Tech Stack

### Frontend

* React Native / React.js

### Backend

* Node.js + Express

### Database

* MongoDB / PostgreSQL

### AI/ML

* Python (Scikit-learn / TensorFlow)

### APIs

* Weather API
* Traffic API
* Maps API

### Payments

* Razorpay (Test Mode) / UPI Simulation

---

## 11. Development Plan

### Phase 1: Ideation & Design

* Problem analysis
* Workflow design
* README + architecture

### Phase 2: Core Implementation

* User onboarding
* Policy management
* Income prediction
* Claim automation

### Phase 3: Optimization & Scaling

* Fraud detection
* Dashboard analytics
* Payment integration

---

## 12. Key Innovation

* Opportunity Loss Insurance (not event-based)
* AI-driven earning prediction
* Micro-loss detection (daily income gaps)
* Fully automated claim and payout system
* Multi-layer anti-spoofing and adversarial fraud defense

---

## 13. Final Statement

**“PulseShield ensures gig workers are compensated not just for disruptions, but for the income they lose because of them — while staying resilient against spoofing, coordinated fraud, and adversarial abuse.”**

---

