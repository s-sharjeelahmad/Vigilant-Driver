# Vigilant Driver — Fix Plan for All Observed Issues

## Current State Summary

| | Status |
|---|---|
| Backend (FastAPI) | ✅ Running, login works, session start/end works |
| Network (phone ↔ PC) | ✅ Reachable at 192.168.50.15:8000 |
| ONNX AI Model | ❌ BLOCKED — native bridge not loaded |
| Stuck DB session | ❌ Blocks new sessions after app crash |
| +not-found route | ⚠️ Warning only — not a crash |
| SafeAreaView | ⚠️ Warning only — not a crash |

---

## Issue 1 (CRITICAL): ONNX `Cannot read property 'install' of null`

### Root Cause (Confirmed)

You are running `expo start --dev-client`, which serves **only the JavaScript bundle** over Metro onto whatever **native APK is already installed** on the Oppo F15.

The APK currently on your phone was installed **before** the `with-onnx-package.js` Config Plugin was created. That old APK does **not** have `OnnxruntimePackage` registered in `MainApplication.kt`. So when the JS tries to call `ort.InferenceSession.create(...)`, the native C++ `install(jsi::Runtime&)` hook is simply `null`.

**No amount of Metro JS reloads will fix this** — the fix requires a new APK binary.

### Why the Gradle Build Failed/Hung

The build has been running ~40 minutes (`.\gradlew.bat app:assembleDebug --stacktrace`) which is abnormal for any subsequent build (first build: 10-15 min, subsequent: 2-4 min). It either:
- Hung waiting for a Gradle daemon lock
- Hit a compile error that the filtered output missed

### Fix Path A — Correct Path (Rebuild APK, install on phone)

This is the right long-term solution.

**Step 1: Kill all stuck Gradle processes**
```powershell
# In mobile-app/android/
.\gradlew.bat --stop
# Wait 5 seconds
taskkill /F /IM java.exe  # nuclear option if daemon won't stop
```

**Step 2: Clean and rebuild**
```powershell
# In mobile-app/android/
.\gradlew.bat clean

# In mobile-app/
npx expo run:android  # Does prebuild → build → install in one command
```
With `ANDROID_SERIAL` set to your device:
```powershell
$env:ANDROID_SERIAL = "9TQCFY75TCSCMRDY"
npx expo run:android
```

**Step 3: Once installed, start Metro**
```powershell
npx expo start --dev-client
```
Open the **Expo Dev Client app** on the phone → scan QR → monitoring screen → `AI Model: Ready`

**Expected result**: Config Plugin already patched `MainApplication.kt` (verified ✅). New APK will have `OnnxruntimePackage` registered → `install()` will succeed → ONNX will load.

---

### Fix Path B — Fallback (Replace ONNX with TensorFlow.js)

Use **only if** the Gradle build keeps failing due to a deeper compilation error.

The app already has `@tensorflow/tfjs` + `@tensorflow/tfjs-react-native` installed. The preprocessing code (ImageNet normalization, resize to 224×224) is already correct and reusable.

**Step 1: Convert model**
```bash
# Install onnx-tf (Python)
pip install onnx-tf tensorflow

# Convert .onnx → SavedModel
python -c "
import onnx
from onnx_tf.backend import prepare
model = onnx.load('assets/models/vigilant_driver_model.onnx')
tf_rep = prepare(model)
tf_rep.export_graph('assets/models/vigilant_driver_tf')
"

# Then convert SavedModel → TF.js
pip install tensorflowjs
tensorflowjs_converter --input_format=tf_saved_model \
  assets/models/vigilant_driver_tf \
  assets/models/vigilant_driver_tfjs
```

**Step 2: Modify `monitoring.tsx`**

Replace the ONNX inference block with:
```typescript
// Remove: import * as ort from 'onnxruntime-react-native'
// Keep: import * as tf from '@tensorflow/tfjs'
// Add:
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const modelJson = require('../assets/models/vigilant_driver_tfjs/model.json');
const modelWeights = require('../assets/models/vigilant_driver_tfjs/group1-shard1of1.bin');

// In loadModel():
await tf.ready();
const model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));

// In runInferenceCycle():
const outputTensor = model.predict(inputTensor) as tf.Tensor;
const outputData = await outputTensor.data();
```

**Pros**: Works in Expo Go too, no native build needed  
**Cons**: TF.js is ~20-50ms slower than ONNX on mobile, model conversion takes time

---

## Issue 2 (HIGH): Stuck Active Session — `400 Driver already has active session`

### Root Cause

When the app crashes or is force-closed during an active session, `PUT /driver/endsession` never fires. The backend has no session timeout, so `session_id: b6e75753...` stays `active` forever in the DB.

### Fix A — Handle in `sessionService.ts` (Resume Stuck Session)

When `POST /driver/newsession` returns 400 with "already has active session", parse the session_id from the error and return it as if we started a new session.

**File**: `mobile-app/src/services/sessionService.ts`

```typescript
async startSession(): Promise<SessionCreateResponse> {
  try {
    const response = await apiClient.post<SessionCreateResponse>('/driver/newsession', {
      start_time: new Date().toISOString(),
      session_status: 'active',
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new AuthError('Session expired. Please log in again.');
    }
    if (error.response?.status === 400) {
      const detail: string = error.response.data?.detail || '';
      
      // ── RECOVERY: If there's already an active session, resume it ──
      const match = detail.match(
        /already has an active session \(session_id: ([a-f0-9-]+)\)/i
      );
      if (match?.[1]) {
        console.warn('[Session] Recovering stuck session:', match[1]);
        // Fetch the existing active session details
        const sessions = await apiClient.get<SessionCreateResponse[]>('/driver/sessions');
        const activeSession = sessions.data.find(s => s.session_status === 'active');
        if (activeSession) return activeSession;
        // Fallback: construct minimal object
        return { session_id: match[1], session_status: 'active' } as SessionCreateResponse;
      }
      
      throw new Error(detail || 'You already have an active session');
    }
    throw new Error('Failed to start session. Check your connection.');
  }
}
```

### Fix B — Backend: Auto-close stuck sessions on new session request (Optional, server-side)

In `app_end.py`, before creating a new session, check for and close any stale active session:

```python
@router.post("/driver/newsession", response_model=schemas.DriverSessionRead)
def create_driver_session(...):
    # Check for existing active session
    active_session = db.query(models.DriverSession).filter(
        models.DriverSession.driver_id == driver_id,
        models.DriverSession.session_status == "active"
    ).first()
    
    if active_session:
        # Auto-close stale sessions older than 4 hours
        if (datetime.utcnow() - active_session.start_time).total_seconds() > 14400:
            active_session.session_status = "interrupted"
            active_session.termination_reason = "auto_closed: stale session"
            active_session.end_time = datetime.utcnow()
            db.commit()
        else:
            raise HTTPException(status_code=400, detail=f"Driver already has an active session ...")
```

**Recommended**: Implement both — client-side recovery for instant UX, server-side cleanup for data hygiene.

---

## Issue 3 (LOW): `+not-found` Route Warning

**File to create**: `mobile-app/app/+not-found.tsx`

```tsx
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 14, color: '#2e78b7' },
});
```

---

## Issue 4 (LOW): `SafeAreaView` Deprecation

**File**: `mobile-app/app/monitoring.tsx`

```typescript
// Remove:
import { ..., SafeAreaView, ... } from 'react-native';

// Add:
import { SafeAreaView } from 'react-native-safe-area-context';
// Keep the rest of react-native imports
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
```

`react-native-safe-area-context` is already installed (`~5.6.0` in package.json).

---

## Execution Order (When You're Ready)

```
Priority 1:  Kill Gradle → Clean → npx expo run:android → install on Oppo F15
Priority 2:  Fix stuck session recovery in sessionService.ts
Priority 3:  Add +not-found.tsx
Priority 4:  Fix SafeAreaView import in monitoring.tsx
Priority 5:  (If build keeps failing) Convert model to TF.js format
```

---

## Quick Manual Workaround for Stuck Session Right Now

If you need to test the rest of the app immediately, clear the stuck session directly in Supabase:

```sql
-- Run in Supabase SQL Editor
UPDATE driver_sessions
SET session_status = 'interrupted', 
    termination_reason = 'manually_cleared',
    end_time = NOW()
WHERE session_status = 'active';
```
