# AI-Powered Loan Customer Follow-up & Voice Calling System

A production-grade AI-powered follow-up CRM and outbound voice calling system for loan management platforms. This system maintains potential customer profiles, schedules intelligent follow-ups, initiates voice calls via Vapi Voice AI provider, processes updates via secure backend API tools, analyzes transcripts using LLMs, auto-schedules next actions, and escalates complex leads to human agents.

---

## 1. Files Created & Project Structure

```
loan-ai-platform/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── calls/
│   │   │   │   └── TranscriptModal.jsx   # Call transcript inspector & summary viewer
│   │   │   ├── common/
│   │   │   │   └── StatusBadge.jsx       # Status, Priority, Call & Sentiment badges
│   │   │   └── layout/
│   │   │       └── Navbar.jsx            # Top navigation header bar
│   │   ├── pages/
│   │   │   ├── Analytics.jsx             # Lead funnel & loan product metrics
│   │   │   ├── Calls.jsx                 # AI Call logs & transcript viewer page
│   │   │   ├── CustomerDetail.jsx        # Detailed customer profile, loan plan & timeline
│   │   │   ├── Customers.jsx             # Customer table, search, filters & add modal
│   │   │   ├── Dashboard.jsx             # CRM KPIs, recent calls & quick action drawer
│   │   │   └── Followups.jsx             # Scheduled follow-up queue & trigger button
│   │   ├── services/
│   │   │   └── api.js                    # Axios API client wrapper
│   │   ├── App.jsx                       # Main React App & routes configuration
│   │   ├── main.jsx                      # React DOM entry point
│   │   └── index.css                     # Tailwind CSS styles
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   └── db.js                         # Mongoose connection with MongoMemoryServer fallback
│   ├── controllers/
│   │   ├── aiToolController.js           # 7 Controlled AI Backend Tools
│   │   ├── analyticsController.js        # KPI & breakdown analytics controller
│   │   ├── callController.js             # Call initiation & logs controller
│   │   ├── customerController.js         # Customer CRUD controller
│   │   ├── followUpController.js         # FollowUp CRUD controller
│   │   └── webhookController.js          # Voice provider webhook handlers (with idempotency)
│   ├── jobs/
│   │   └── followUpScheduler.js          # node-cron 1-minute background follow-up worker
│   ├── models/
│   │   ├── AuditLog.js                   # System audit trail schema
│   │   ├── Call.js                       # Call logs, transcript & sentiment schema
│   │   ├── Customer.js                   # Potential customer & financial profile schema
│   │   └── FollowUp.js                   # Follow-up schedule & priority schema
│   ├── routes/
│   │   ├── aiToolRoutes.js               # Express routes for /api/ai-tools/*
│   │   ├── analyticsRoutes.js            # Express routes for /api/analytics/*
│   │   ├── callRoutes.js                 # Express routes for /api/calls/*
│   │   ├── customerRoutes.js             # Express routes for /api/customers/*
│   │   ├── followUpRoutes.js             # Express routes for /api/followups/*
│   │   └── webhookRoutes.js              # Express routes for /api/voice/*
│   ├── seed/
│   │   ├── seed.js                       # DB Seed command runner
│   │   └── seedData.js                   # Reusable seed data generator (10 demo leads)
│   ├── services/
│   │   ├── llmService.js                 # Post-call transcript analysis (GPT-4o / fallback)
│   │   ├── postCallService.js            # Post-call DB synchronization & rescheduling logic
│   │   └── voiceService.js               # Vapi provider abstraction (Live + Mock modes)
│   ├── package.json
│   └── server.js                         # Express server entry point
├── .env.example
├── .env
├── package.json                          # Root repository scripts runner
└── README.md                             # Documentation
```

---

## 2. Database Changes & Schemas

The backend uses MongoDB with Mongoose. Four primary collections maintain the system state:

1. **`Customer`**:
   - `name`, `phone`, `email`, `preferredLanguage`, `preferredCallTime`
   - `customerStatus`: `NEW`, `CONTACTED`, `INTERESTED`, `APPLICATION_STARTED`, `DOCUMENTS_PENDING`, `DOCUMENTS_SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CALLBACK_REQUESTED`, `NOT_INTERESTED`, `UNREACHABLE`, `CONVERTED`
   - `loan`: `{ type, amount, tenure, purpose }`
   - `financialProfile`: `{ monthlyIncome, employmentType, existingEMI, creditScore }`
   - `loanPlan`: `{ eligibleAmount, interestRate, estimatedEMI, tenure }`
   - `pendingDocuments`: `[{ name, status: 'PENDING'|'SUBMITTED'|'VERIFIED'|'REJECTED', uploadedAt }]`
   - `followUp`: `{ enabled, nextFollowUpAt, lastFollowUpAt, attempts }`
   - `consent`: `{ voiceCalls, recordedCalls }`

2. **`FollowUp`**:
   - `customerId`, `reason`, `scheduledAt`
   - `status`: `SCHEDULED`, `READY`, `CALLING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REQUIRES_HUMAN`
   - `priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
   - `attempts`, `maxAttempts`, `lastAttemptAt`, `completedAt`, `outcome`, `notes`

3. **`Call`**:
   - `customerId`, `followUpId`, `providerCallId`, `phoneNumber`, `direction` (`OUTBOUND`/`INBOUND`)
   - `status`: `INITIATED`, `RINGING`, `IN_PROGRESS`, `COMPLETED`, `NO_ANSWER`, `BUSY`, `FAILED`, `CANCELLED`, `TRANSFERRED`
   - `startedAt`, `endedAt`, `duration`
   - `transcript`: `[{ role: 'assistant'|'user'|'system', text, timestamp }]`
   - `summary`, `outcome`, `customerIntent`, `sentiment`, `nextAction`, `requiresHuman`

4. **`AuditLog`**:
   - `action`, `performedBy`, `entityType`, `entityId`, `details`, `createdAt`

---

## 3. Environment Variables Configuration

Create a `.env` file in the root workspace directory based on `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loan_ai_db
VOICE_AI_PROVIDER=vapi
VOICE_AI_API_KEY=your_vapi_api_key
VOICE_AI_PHONE_NUMBER_ID=your_vapi_phone_number_id
LLM_API_KEY=your_llm_api_key
LLM_MODEL=gpt-4o-mini
JWT_SECRET=super_secret_jwt_key_loan_ai_2026
APP_BASE_URL=http://localhost:5000
WEBHOOK_SECRET=webhook_secret_key_12345
ENABLE_MOCK_VOICE=true
```

> **Note on Mock Mode**: Set `ENABLE_MOCK_VOICE=true` during local development to simulate voice calls and transcript processing without incurring Vapi telephony charges.

---

## 4. API Endpoints Reference

### Customers API
- `GET /api/customers` - List customers with search & status filters
- `GET /api/customers/:id` - Fetch customer detail profile
- `POST /api/customers` - Add new potential customer
- `PUT /api/customers/:id` - Update customer details or document status
- `DELETE /api/customers/:id` - Delete customer

### Follow-ups API
- `GET /api/followups` - Fetch follow-up queue
- `GET /api/followups/:id` - Fetch single follow-up
- `POST /api/followups` - Schedule new follow-up
- `PUT /api/followups/:id` - Update follow-up record
- `DELETE /api/followups/:id` - Cancel follow-up

### Calls API
- `GET /api/calls` - Fetch call history logs
- `GET /api/calls/:id` - Fetch call record & transcript
- `POST /api/calls/initiate` - Manually trigger an outbound AI voice call

### Voice AI Backend Tools (`/api/ai-tools/*`)
- `POST /api/ai-tools/customer` - `get_customer_profile`
- `POST /api/ai-tools/update-status` - `update_customer_status`
- `POST /api/ai-tools/update-document` - `update_document_status`
- `POST /api/ai-tools/update-intent` - `update_customer_intent`
- `POST /api/ai-tools/schedule-followup` - `schedule_followup`
- `POST /api/ai-tools/human-escalation` - `request_human_agent`
- `POST /api/ai-tools/call-outcome` - `update_call_outcome`

### Webhooks (`/api/voice/*`)
- `POST /api/voice/webhook` - General Vapi event handler
- `POST /api/voice/call-status` - Real-time call status updates
- `POST /api/voice/call-ended` - Final call transcript & completion handler

### Analytics API
- `GET /api/analytics/dashboard` - KPI summary, lead status breakdown & loan stats

---

## 5. Voice Provider Setup (Vapi)

1. Sign up for a Vapi account at [https://vapi.ai](https://vapi.ai).
2. Obtain your **Private API Key** and an **Outbound Phone Number ID**.
3. In your Vapi Dashboard, point your Server URL to your public API address:
   `https://your-domain.com/api/voice/webhook`
4. Set `VOICE_AI_API_KEY` and `VOICE_AI_PHONE_NUMBER_ID` in your `.env` file.
5. Set `ENABLE_MOCK_VOICE=false` to switch to live PSTN calling.

---

## 6. Run Instructions

### Prerequisites
- Node.js v18+ and npm
- (Optional) Local MongoDB server (If local MongoDB is not running, the application automatically boots `MongoMemoryServer` in memory!)

### Installation & Startup
```bash
# 1. Install dependencies for root, server, and client
npm install
npm --prefix server install
npm --prefix client install

# 2. Seed database with 10 demo customers
npm run seed

# 3. Start Backend Express Server (runs on http://localhost:5000)
npm run server

# 4. Start Frontend React Vite Client (in a separate terminal, runs on http://localhost:3000)
npm run client
```

---

## 7. Manual Call Testing Instructions (Milestone 1)

1. Open the web dashboard at `http://localhost:3000`.
2. Navigate to **Customers** tab.
3. Select customer **Rahul Sharma** (Status: `DOCUMENTS_PENDING`).
4. Click the **Call Now** button.
5. The backend validates consent, creates an `INITIATED` call record, builds customer context (Loan: Personal Loan ₹5,00,000, Pending: Bank Statement), and triggers outbound voice AI.
6. In Mock Mode (`ENABLE_MOCK_VOICE=true`), the system automatically simulates customer responses in 3 seconds, triggers post-call LLM analysis, updates document status, and auto-schedules the next follow-up.
7. Navigate to **Call Logs** tab and click **View Transcript** to inspect conversation transcript, AI summary, sentiment, and customer intent!

---

## 8. Automatic Follow-up Scheduler

The system includes a background `node-cron` worker (`server/jobs/followUpScheduler.js`) running every 1 minute:
- Finds due follow-ups where `scheduledAt <= now` and status is `SCHEDULED`.
- Validates customer consent (`consent.voiceCalls: true`) and auto follow-up preference (`followUp.enabled: true`).
- Enforces duplicate call protection (verifies no active call is currently in progress for the customer).
- Locks the follow-up by setting status to `CALLING` and increments attempt count.
- Triggers `voiceService.initiateCall()` and links provider call ID.
- Automatically escalates to `REQUIRES_HUMAN` status if max call attempts (`maxAttempts: 3`) are exceeded.

---

## 9. Security & Financial Safety

1. **No Direct DB Access**: Voice AI agents interact exclusively through validated REST API endpoints (`/api/ai-tools/*`).
2. **Financial Boundaries**: The AI voice assistant is strictly forbidden from changing interest rates, altering official loan terms, guaranteeing loan approvals, or autonomously rejecting applicants.
3. **Data Sanitization**: Passwords, OTPs, PINs, CVVs, full bank account numbers, and API keys are strictly excluded from AI prompts and log entries.
4. **Idempotency**: Webhook processing uses unique event signatures and provider call IDs to prevent duplicate status or document updates.

---

## 10. Known Limitations & Future Roadmap

### Current Limitations
- Initial version uses `node-cron` for scheduling. For multi-node cluster deployments, BullMQ + Redis is recommended to prevent job duplication across server nodes.
- Webhook endpoints require standard `WEBHOOK_SECRET` header validation.

### Future Improvements
- Multilingual Voice Support (Hindi, Tamil, Telugu, Kannada, Bengali).
- Live Human Transfer (WebRTC / PSTN transfer when customer requests human officer).
- Multi-channel follow-up integration (WhatsApp & SMS reminder integration).
- Lead Scoring Engine based on call sentiment & document upload velocity.
# AI_VoiceAssistant
