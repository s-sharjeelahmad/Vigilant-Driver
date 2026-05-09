# 🚀 Complete Integration Setup - Vigilant Driver

## ✅ What's Been Done

### Mobile App

- ✅ API client with JWT authentication (`src/services/apiClient.ts`)
- ✅ Authentication service (`src/services/authService.ts`)
- ✅ Session management API (`src/services/sessionService.ts`)
- ✅ SessionContext updated to sync with backend
- ✅ Monitoring screen handles async session operations
- ✅ API_BASE_URL set to your IP: **`http://172.16.85.244:8000`**
- ✅ Dependencies installed: `axios`, `expo-secure-store`

### Backend

- ✅ Complete FastAPI backend with Supabase
- ✅ `requirements.txt` created
- ✅ `.env.example` template created
- ✅ `setup_backend.py` script to initialize database
- ✅ Comprehensive `README.md` with setup instructions

---

## 📋 Next Steps - Backend Setup (10-15 minutes)

### Step 1: Get Supabase Credentials

**Option A: Ask Areeb (Faster)**

- Ask Areeb for the `.env` file or Supabase credentials
- He may have already set everything up

**Option B: Create Your Own (15 min)**

1. Go to https://supabase.com
2. Sign up/Login (free tier is fine)
3. Click "New Project"
4. Fill in:
   - Name: `vigilant-driver`
   - Database Password: (save this!)
   - Region: Choose closest to you
5. Wait 2-3 minutes for project to initialize

### Step 2: Configure Backend

```powershell
# Navigate to backend folder
cd C:\Users\syeds\Documents\GitHub\Final-Year-Project\FYP testing\fyp_startup\backened_code_final

# Create .env file from template
copy .env.example .env

# Open .env in notepad
notepad .env
```

**Fill in Supabase credentials:**

From Supabase Dashboard → **Settings** → **API**:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...your-anon-key
```

From Supabase Dashboard → **Settings** → **Database**:

```env
SUPABASE_DB_URL=postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

Save and close the file.

### Step 3: Install Python Dependencies

```powershell
# Activate virtual environment (if not already)
cd C:\Users\syeds\Downloads\FYP\vigilant_driver
.\venv\Scripts\Activate.ps1

# Install requirements
cd backened_code_final
pip install -r requirements.txt
```

### Step 4: Initialize Database

```powershell
# Run setup script
python setup_backend.py
```

**This will:**

- Create database tables (`drivers`, `driver_sessions`)
- Create 3 test drivers
- Display UUIDs you need to copy

**Copy the output!** You'll need the UUIDs for the mobile app.

### Step 5: Add CORS to Backend

Open `main.py` and add these lines **after** `app = FastAPI()`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 6: Start Backend

```powershell
uvicorn backened_code_final.authentication.main_1:app --reload --host 0.0.0.0 --port 8000
```

**You should see:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Test it:** Open browser → `http://localhost:8000/docs`

---

## 📱 Mobile App Update (5 minutes)

### Step 1: Update MOCK_DRIVERS with UUIDs

After running `setup_backend.py`, copy the UUIDs it displays.

**File:** `mobile-app/src/utils/constants.ts`

Find this section:

```typescript
export const MOCK_DRIVERS = [
  {
    id: 1,
    name: "Syed Sharjeel Ahmad",
    cnic: "12345-1234567-1",
    phone: "0314-2020202",
  },
  // ...
];
```

Replace with:

```typescript
export const MOCK_DRIVERS = [
  {
    id: "YOUR-UUID-FROM-SETUP-SCRIPT", // e.g., "550e8400-e29b-41d4-a716-..."
    name: "Syed Sharjeel Ahmad",
    cnic: "1234512345671", // 13 digits, no dashes
    phone: "03142020202",
    password: "test123", // Add this field
  },
  // ... paste other two drivers
];
```

### Step 2: Update Driver Type (Add Password Field)

**File:** `mobile-app/src/types/index.ts`

Find the `Driver` interface and add `password?`:

```typescript
export interface Driver {
  id: string; // Changed from number to string (UUID)
  name: string;
  cnic: string;
  phone?: string;
  password?: string; // ADD THIS LINE
}
```

### Step 3: Update Login Screen (Add Password Input)

**File:** `mobile-app/app/(auth)/login.tsx`

I'll help you add a password field once you confirm the UUIDs are set.

---

## 🧪 Testing (5 minutes)

### Test 1: Backend Health Check

Open browser or curl:

```bash
http://172.16.85.244:8000
```

Should return: `{"message": "Hello World"}`

### Test 2: Login API

```bash
curl -X POST "http://172.16.85.244:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"driver_id\": \"YOUR-UUID\", \"password\": \"test123\"}"
```

Should return JWT token.

### Test 3: Mobile App Login

1. Restart Metro bundler (Ctrl+C, then `npm start`)
2. Open app on phone
3. Select driver
4. (If password field added) Enter `test123`
5. Tap "Start Monitoring"
6. Should navigate to dashboard

### Test 4: Session Creation

1. Go to Monitoring screen
2. Tap "Start Monitoring"
3. Check backend terminal logs - should see:
   ```
   INFO:     POST /driver/newsession - 200 OK
   ```
4. Run monitoring for 1-2 minutes
5. Tap "Stop Monitoring"
6. Check backend logs:
   ```
   INFO:     PUT /driver/endsession - 200 OK
   ```

---

## 📊 Architecture Overview

```
┌─────────────────────────┐
│   Mobile App (Expo)     │
│   React Native          │
│   - Login Screen        │
│   - Monitoring Screen   │
│   - SessionContext      │
└───────────┬─────────────┘
            │
            │ HTTP + JWT Token
            ↓
┌─────────────────────────┐
│   API Services          │
│   - apiClient.ts        │
│   - authService.ts      │
│   - sessionService.ts   │
└───────────┬─────────────┘
            │
            │ axios requests
            ↓
┌─────────────────────────┐
│   FastAPI Backend       │
│   (Your IP: 172.16...)  │
│   - POST /auth/login    │
│   - POST /newsession    │
│   - PUT /endsession     │
└───────────┬─────────────┘
            │
            │ SQLAlchemy ORM
            ↓
┌─────────────────────────┐
│   Supabase PostgreSQL   │
│   - drivers table       │
│   - driver_sessions     │
└─────────────────────────┘
```

---

## 🔥 Quick Commands Cheat Sheet

### Start Backend

```powershell
cd C:\Users\syeds\Downloads\FYP\vigilant_driver
.\venv\Scripts\Activate.ps1
cd C:\Users\syeds\Documents\GitHub\Final-Year-Project\FYP testing\fyp_startup
uvicorn backened_code_final.authentication.main_1:app --reload --host 0.0.0.0 --port 8000
```

### Start Mobile App

```powershell
cd C:\Users\syeds\Downloads\FYP\vigilant_driver\mobile-app
npm start
```

### View Backend API Docs

```
http://localhost:8000/docs
```

### Test from Phone Browser

```
http://172.16.85.244:8000
```

---

## ⚠️ Important Notes

1. **Same WiFi Network:** Phone and computer must be on the same network
2. **Firewall:** Windows Firewall may block port 8000 - allow if prompted
3. **IP Address:** If WiFi changes, update `API_BASE_URL` in `constants.ts`
4. **Token Expiry:** JWT tokens expire after 10 minutes (set in backend)
5. **CORS:** Required for mobile app to call backend APIs

---

## 🐛 Troubleshooting

### "Connection refused" on mobile app

- ✅ Backend is running: Check terminal
- ✅ Using correct IP: `172.16.85.244` not `localhost`
- ✅ Same WiFi: Phone and computer connected to same network
- ✅ Firewall: Allow Python/uvicorn through Windows Firewall

### "Driver not found" on login

- ✅ Ran `setup_backend.py`?
- ✅ UUIDs updated in `MOCK_DRIVERS`?
- ✅ Check Supabase dashboard for drivers table

### Backend won't start

- ✅ Virtual environment activated?
- ✅ All dependencies installed? (`pip install -r requirements.txt`)
- ✅ `.env` file exists with correct credentials?
- ✅ Port 8000 not already in use?

---

## 📞 Current Status

✅ **Mobile App:** Ready - just needs driver UUIDs
✅ **Backend:** Boilerplate ready - needs Supabase credentials
✅ **API Integration:** Complete - all services implemented
✅ **IP Configuration:** Set to `172.16.85.244:8000`

---

## 🎯 Your Action Items

1. **Get Supabase credentials** (from Areeb or create new project)
2. **Run `setup_backend.py`** to create test drivers
3. **Copy UUIDs** to `MOCK_DRIVERS` in mobile app
4. **Start backend** with uvicorn
5. **Test login** from mobile app

**Estimated Time:** 15-20 minutes

**Let me know when you have Supabase credentials and I'll guide you through the rest!** 🚀
