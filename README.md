# 🟢 Beacon — Voice-First Patient Care Assistant (Hackathon MVP)

> **Beacon** is a hackathon MVP of a closed-loop referral system designed to reduce missed healthcare follow-ups in remote and underserved communities.  
>  
> This prototype demonstrates how a **voice-first patient assistant** combined with nurse-side automation can reduce friction, provide support during storms or isolation, and prevent patients from falling through the cracks.

---

## 🧠 Problem  

Patients in remote and rural communities face major barriers to care:

- Long travel distances to hospitals  
- Severe weather disruptions  
- Limited internet access  
- Seniors struggling with complex apps  
- Fragmented follow-ups after referrals  
- Isolation impacting mental health  

This leads to missed appointments, delayed care, and worse health outcomes.

---

## 💡 What This MVP Proves  

This hackathon MVP validates:

- A **patient-facing voice agent** as the primary interface  
- Automated scheduling and rescheduling via voice  
- Weather-aware guidance for travel safety  
- Basic virtual doctor guidance  
- Mental health support routing  
- Nurse-side visibility into missed appointments  
- Closed-loop referral workflows  

⚠️ This prototype **does not include real SMS, push notifications, real phone calls, or a production database.**  
All backend logic is simulated client-side for demo purposes.

---

## ✨ Current Features (MVP Scope)

### 🎙 Patient Voice Agent (Gemini-Powered)
Patients can speak naturally to Beacon to:

- 📅 **Schedule & reschedule appointments**  
- ⏰ **Ask about upcoming appointment times**  
- 🌨️ **Get weather updates for travel safety**  
- 🩺 **Virtual Doctor Mode**  
  - Basic health recommendations  
  - Symptom guidance (non-diagnostic)  
- 🧠 **Mental Health Support Mode**  
  - Emotional support responses  
  - Crisis resource suggestions and hotlines  
- 📍 **Care Info**  
  - Hospital location & travel tips  

### 👩‍⚕️ Nurse Dashboard (Web)
- Automatically flags missed appointments  
- Priority queue for high-risk patients  
- Manual follow-up workflows  
- Smart rescheduling with capacity limits  
- Transport request simulation  

### ⚙️ Automation Engine (Simulated Backend)
- Background worker marks missed referrals  
- Risk escalation logic  
- Client-side data persistence (LocalStorage)  
- Simulated system events  

---

## 🚧 What’s Simulated / Not Implemented  

| Feature | Status |
|--------|--------|
Nurse Voice Agent | ❌ Not implemented  
Real Voice Calls | ❌ Not implemented  
SMS | ❌ Not implemented  
Push Notifications | ❌ Not implemented  
Backend API | ❌ Simulated client-side  
Database | ❌ LocalStorage only  
Transport Dispatch | ⚠️ UI flow only  

---

## 🏗 Tech Stack (MVP)

- **Frontend:** React + TypeScript  
- **Styling:** Tailwind CSS  
- **AI:** Google Gemini (patient voice agent + call scripts)  
- **Persistence:** Browser LocalStorage  
- **Backend:** Simulated API service  
- **Voice Input:** Web Speech API  
- **TTS:** Browser Text-to-Speech  

---

## 🎮 Demo Flow  

### Patient
1. Click mic  
2. Say:  
   - “When is my next appointment?”  
   - “Reschedule my appointment to tomorrow afternoon.”  
   - “What’s the weather like for traveling tomorrow?”  
   - “I’m feeling anxious today.”  
3. Beacon responds with voice + text  

### Nurse
1. Create referral  
2. Force mark as missed  
3. Watch escalation  
4. Generate AI call script  
5. Reschedule  

---

## 🛣 Roadmap (Post-Hackathon Vision)

- Real backend (Postgres + API)  
- Real voice calling (Twilio)  
- SMS fallback for storms  
- Offline-first mobile app  
- Indigenous language support  
- Care worker routing  
- Transport provider integrations  

---

## 🧠 Safety & Ethics  

- Medical advice is **non-diagnostic**  
- Mental health mode always provides external support lines  
- Clear disclaimers to avoid medical misuse  
- Data is minimal and local in MVP  

---

## 🏁 Status  

Hackathon MVP — concept validation prototype.

---

## 👥 Team Vision  

Healthcare access shouldn’t depend on tech literacy.  
Beacon replaces interfaces with conversation and automation.

