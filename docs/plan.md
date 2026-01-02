# Summary of the Problem and the System We Are Building

## 1. Background and Long-Term Problem

The company operates a reusable packaging box system (consumables) that circulates continuously through a supply chain:

**Factory → Third-party logistics platform → Client site → Third-party logistics platform → Factory**

These boxes are not single-use items; they are long-lived, reusable assets whose quantity is the core concern.

For more than 15 years, the company has faced the same recurring issue:

> **Every year, accounting reports a significant financial loss caused by missing or damaged boxes.**

Management is aware of the loss but cannot clearly determine:

- where the loss occurs,
- whether it is caused by factories, the third-party platform, or normal operational friction,
- or how to prevent it in a systematic way.

The following year, the same problem repeats.

**This indicates a structural visibility and evidence problem, not a short-term operational mistake.**

---

## 2. Reality of Operations (Key Constraints)

The system operates under several unavoidable real-world constraints:

### The process never truly "ends"
The box circulation is a continuously running system. There is no natural closure except if the company stops operating.

### Daily operations are not a closed loop
- Boxes sent to the platform on one day may return on a later day.
- Daily in/out numbers frequently do not match, and this is normal.

### Managers cannot perfectly verify quantities
At the end of the day:

- Boxes are stacked irregularly on the shop floor.
- Drivers are in a hurry.
- Managers may be interrupted and cannot physically count boxes.

Quantities are often based on:

- verbal declarations by drivers,
- factory instructions ("we need 140 tomorrow"),
- managerial authorization without verification.

### Precision is often impossible
- The recorded number may not equal the actual physical number.
- However, both sides (manager and factory) still acknowledge the number for operational continuity.

### Audits happen too late
Accounting typically audits only after losses become severe, at which point:

- evidence is incomplete,
- records are inconsistent,
- and root causes are no longer traceable.

---

## 3. What the System Is Not

This system is **not** intended to be:

- a real-time inventory management system,
- a fully automated tracking system,
- a system that enforces daily balance,
- or a system that immediately detects theft.

**Attempting any of the above would contradict physical and organizational reality.**

---

## 4. What the System Is

The system is designed as a:

### **Rolling ledger and evidence-building system for reusable assets**

Key characteristics:

### Event-based, not state-based
All quantity changes are recorded as events, not as mutable inventory states.

### Rolling, perpetual ledger
- There is no daily closure.
- Each day is an audit slice, not a settlement boundary.
- Long-term trends and cumulative balances are what matter.

### Bilateral acknowledgment instead of physical certainty
Critical records (especially daily returns) are treated as:

- **acknowledged declarations**, not guaranteed physical measurements.

Their value comes from:

- mutual confirmation,
- timestamps,
- and immutability after confirmation.

### Explicit modeling of uncertainty
Each settlement record captures:

- how the quantity was determined (verbal, estimated, counted, factory directive),
- rather than pretending all numbers have equal reliability.

### Auditability over accuracy
The primary goal is not perfect accuracy at the moment of recording, but:

- traceability,
- replayability,
- and credibility during later audits (especially year-end).

---

## 5. Core Objective

The primary objective of the system is:

> **To transform long-standing, ambiguous asset losses into a structured, auditable evidence trail that can be analyzed over time.**

Concretely, this allows the company to:

- move from **annual, reactive financial audits**  
  → to **continuous, operational evidence accumulation**;

- distinguish between:
  - normal operational loss,
  - record uncertainty,
  - and structural, long-term abnormal behavior;

- support year-end settlement with **confirmed, traceable records** rather than estimates or assumptions.

---

## 6. Expected Outcome

If the system is successful, the end-of-year conversation changes from:

### Before:
> *"We lost X amount of money again. What can we do?"*

### After:
> *"Losses this year were concentrated in these factories, during these periods, under these conditions, with this level of verification confidence. Here are the trends, not just the totals."*

**This does not automatically solve the problem, but it makes informed governance possible for the first time.**