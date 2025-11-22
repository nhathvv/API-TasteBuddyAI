# Progressive Loading API - TasteBuddyAI

## 📌 Overview

TasteBuddyAI cung cấp **3 strategies** để tối ưu loading time và cải thiện UX:

1. **SSE Streaming** (Server-Sent Events) - Real-time progressive updates
2. **Micro-endpoints** - Call từng bước riêng biệt
3. **Sync Endpoint** (traditional) - Single request, single response

---

## 🚀 Strategy 1: SSE Streaming (Recommended)

### **Timeline:**
```
0s    → Upload accepted, jobId returned
2-5s  → Extraction complete (stream update)
5-8s  → Dish understanding complete (stream update)
8-16s → Allergen & dietary analysis complete (stream update)
```

### **Backend Endpoints:**
- **POST** `/menu/upload/scan-async` - Upload image, get jobId
- **GET (SSE)** `/menu/jobs/:jobId/stream` - Listen to progressive updates
- **GET** `/menu/jobs/:jobId` - Polling fallback

---

### **Frontend Example (React + TypeScript)**

```typescript
import React, { useState, useEffect } from 'react';

interface JobProgress {
  extraction?: { totalItems: number };
  dishUnderstanding?: { totalDishes: number; averageConfidence: number };
  allergenAnalysis?: { safeItems: number; unsafeItems: number };
  finalResult?: any;
}

export const MenuScannerSSE: React.FC = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<JobProgress>({});
  const [currentStage, setCurrentStage] = useState<string>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload image and get jobId
  const uploadImage = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', 'vi');
    formData.append('allergens', JSON.stringify([
      { type: 'shellfish', severity: 'severe' }
    ]));

    try {
      const response = await fetch('/menu/upload/scan-async', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setJobId(data.jobId);

      // Start listening to stream
      listenToStream(data.jobId);
    } catch (err) {
      setError('Upload failed');
      setLoading(false);
    }
  };

  // Step 2: Listen to SSE stream
  const listenToStream = (jobId: string) => {
    const eventSource = new EventSource(`/menu/jobs/${jobId}/stream`);

    eventSource.addEventListener('message', (e) => {
      const event = JSON.parse(e.data);
      console.log('📡 SSE Event:', event);

      switch (event.type) {
        case 'connected':
          console.log('✅ Connected to stream:', event.jobId);
          break;

        case 'stage_update':
          handleStageUpdate(event);
          break;

        case 'job_completed':
          handleJobCompleted(event);
          eventSource.close();
          setLoading(false);
          break;

        case 'job_failed':
          setError(event.error);
          eventSource.close();
          setLoading(false);
          break;
      }
    });

    eventSource.onerror = (err) => {
      console.error('❌ SSE Error:', err);
      eventSource.close();
      setLoading(false);
      setError('Stream connection failed');
    };
  };

  // Handle stage updates
  const handleStageUpdate = (event: any) => {
    setCurrentStage(event.stage);

    switch (event.stage) {
      case 'extraction':
        if (event.status === 'completed') {
          setProgress(prev => ({
            ...prev,
            extraction: event.data,
          }));
        }
        break;

      case 'dish_understanding':
        if (event.status === 'completed') {
          setProgress(prev => ({
            ...prev,
            dishUnderstanding: event.data,
          }));
        }
        break;

      case 'allergen_analysis':
        if (event.status === 'completed') {
          setProgress(prev => ({
            ...prev,
            allergenAnalysis: event.data,
          }));
        }
        break;
    }
  };

  // Handle job completion
  const handleJobCompleted = (event: any) => {
    setProgress(prev => ({
      ...prev,
      finalResult: event.result,
    }));
    setCurrentStage('completed');
  };

  return (
    <div>
      <h2>Menu Scanner (SSE Streaming)</h2>

      {/* Upload Form */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />

      {/* Progress Display */}
      {loading && (
        <div>
          <h3>Processing... {currentStage}</h3>

          {progress.extraction && (
            <div>
              ✅ Extraction: {progress.extraction.totalItems} items found
            </div>
          )}

          {progress.dishUnderstanding && (
            <div>
              ✅ Dish Understanding: {progress.dishUnderstanding.totalDishes} dishes analyzed
              (confidence: {(progress.dishUnderstanding.averageConfidence * 100).toFixed(1)}%)
            </div>
          )}

          {progress.allergenAnalysis && (
            <div>
              ✅ Allergen Analysis: {progress.allergenAnalysis.safeItems} safe,
              {progress.allergenAnalysis.unsafeItems} unsafe
            </div>
          )}
        </div>
      )}

      {/* Final Result */}
      {progress.finalResult && (
        <div>
          <h3>🎉 Analysis Complete!</h3>
          <pre>{JSON.stringify(progress.finalResult, null, 2)}</pre>
        </div>
      )}

      {/* Error */}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};
```

---

### **Frontend Example (Vanilla JavaScript)**

```javascript
// Upload image and listen to stream
async function scanMenuWithSSE(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('language', 'vi');
  formData.append('allergens', JSON.stringify([
    { type: 'shellfish', severity: 'severe' }
  ]));

  // Step 1: Upload
  const uploadResponse = await fetch('/menu/upload/scan-async', {
    method: 'POST',
    body: formData,
  });
  const { jobId } = await uploadResponse.json();

  console.log('🚀 Job created:', jobId);

  // Step 2: Listen to SSE
  const eventSource = new EventSource(`/menu/jobs/${jobId}/stream`);

  eventSource.addEventListener('message', (e) => {
    const event = JSON.parse(e.data);

    switch (event.type) {
      case 'connected':
        console.log('✅ Connected to stream');
        showProgress('Connecting...');
        break;

      case 'stage_update':
        if (event.stage === 'extraction' && event.status === 'completed') {
          console.log('📄 Extraction complete:', event.data.totalItems, 'items');
          showProgress(`Extracted ${event.data.totalItems} items`);
        }

        if (event.stage === 'dish_understanding' && event.status === 'completed') {
          console.log('🍲 Dish understanding complete:', event.data.totalDishes, 'dishes');
          showProgress(`Analyzed ${event.data.totalDishes} dishes`);
        }

        if (event.stage === 'allergen_analysis' && event.status === 'completed') {
          console.log('⚠️ Allergen analysis complete:', event.data);
          showProgress(`Safety check: ${event.data.safeItems} safe, ${event.data.unsafeItems} unsafe`);
        }
        break;

      case 'job_completed':
        console.log('🎉 Job completed!', event.result);
        displayFinalResult(event.result);
        eventSource.close();
        break;

      case 'job_failed':
        console.error('❌ Job failed:', event.error);
        showError(event.error);
        eventSource.close();
        break;
    }
  });

  eventSource.onerror = (err) => {
    console.error('❌ SSE connection error:', err);
    eventSource.close();
  };
}

// UI helpers
function showProgress(message) {
  document.getElementById('progress').textContent = message;
}

function showError(error) {
  document.getElementById('error').textContent = error;
}

function displayFinalResult(result) {
  document.getElementById('result').innerHTML = `
    <h3>✅ Analysis Complete</h3>
    <pre>${JSON.stringify(result, null, 2)}</pre>
  `;
}
```

---

## 🔧 Strategy 2: Micro-endpoints (Flexible Control)

### **Timeline:**
```
FE controls timing:
Step 1: Extract menu (2-5s) → Show immediately
Step 2: Analyze dishes (2-3s/dish) → Show ingredients
Step 3: Check allergens (3-8s) → Show safety warnings
Step 4: Check dietary (3-5s) → Show compliance
```

### **Backend Endpoints:**
- **POST** `/menu/analysis/extraction` - Extract menu only (fast)
- **POST** `/menu/analysis/dishes` - Analyze dishes (ingredients)
- **POST** `/menu/analysis/allergens` - Check allergen safety
- **POST** `/menu/analysis/dietary` - Check dietary compliance

---

### **Frontend Example (React + TypeScript)**

```typescript
import React, { useState } from 'react';

interface MenuExtraction {
  menuSections: Array<{
    sectionName: string;
    items: Array<{ name: string; price: number }>;
  }>;
  metadata: { totalItems: number; processingTime: number };
}

interface DishAnalysis {
  dishes: Array<{
    canonicalName: string;
    ingredients: Array<{ name: string; isPrimary: boolean }>;
    allergenSignals: string[];
  }>;
}

export const MenuScannerMicroEndpoints: React.FC = () => {
  const [extraction, setExtraction] = useState<MenuExtraction | null>(null);
  const [dishAnalysis, setDishAnalysis] = useState<DishAnalysis | null>(null);
  const [allergenAnalysis, setAllergenAnalysis] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const scanMenu = async (file: File) => {
    // Step 1: Extract menu (FAST - 2-5s)
    setCurrentStep(1);
    const extractionResult = await extractMenuOnly(file);
    setExtraction(extractionResult);

    // Step 2: Analyze dishes (2-3s per dish)
    setCurrentStep(2);
    const dishResult = await analyzeDishes(extractionResult.menuSections[0].items);
    setDishAnalysis(dishResult);

    // Step 3: Check allergens (3-8s)
    setCurrentStep(3);
    const allergenResult = await analyzeAllergens(
      extractionResult.menuSections[0].items,
      dishResult.dishes,
      [{ type: 'shellfish', severity: 'severe' }]
    );
    setAllergenAnalysis(allergenResult);

    setCurrentStep(4); // Done
  };

  // Step 1: Extract menu only
  const extractMenuOnly = async (file: File): Promise<MenuExtraction> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', 'vi');
    formData.append('useCloudVision', 'true');

    const response = await fetch('/menu/analysis/extraction', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  };

  // Step 2: Analyze dishes
  const analyzeDishes = async (menuItems: any[]): Promise<DishAnalysis> => {
    const response = await fetch('/menu/analysis/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItems, language: 'vi' }),
    });

    return response.json();
  };

  // Step 3: Analyze allergens
  const analyzeAllergens = async (
    menuItems: any[],
    enrichedDishes: any[],
    allergens: any[]
  ) => {
    const response = await fetch('/menu/analysis/allergens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItems, enrichedDishes, allergens, language: 'vi' }),
    });

    return response.json();
  };

  return (
    <div>
      <h2>Menu Scanner (Micro-endpoints)</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) scanMenu(file);
        }}
      />

      {/* Step 1: Show extracted menu immediately */}
      {extraction && (
        <div>
          <h3>✅ Menu Extracted ({extraction.metadata.processingTime}ms)</h3>
          <ul>
            {extraction.menuSections[0].items.map((item, idx) => (
              <li key={idx}>{item.name} - {item.price}₫</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 2: Show dish analysis */}
      {dishAnalysis && (
        <div>
          <h3>✅ Dishes Analyzed</h3>
          {dishAnalysis.dishes.map((dish, idx) => (
            <div key={idx}>
              <h4>{dish.canonicalName}</h4>
              <p>Ingredients: {dish.ingredients.map(i => i.name).join(', ')}</p>
              {dish.allergenSignals.length > 0 && (
                <p>⚠️ Allergen signals: {dish.allergenSignals.join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Show allergen safety */}
      {allergenAnalysis && (
        <div>
          <h3>✅ Safety Check Complete</h3>
          <p>Safe items: {allergenAnalysis.summary.safeItems}</p>
          <p>Unsafe items: {allergenAnalysis.summary.unsafeItems}</p>
        </div>
      )}

      {/* Progress indicator */}
      <div>
        Step {currentStep}/3:
        {currentStep === 1 && ' Extracting menu...'}
        {currentStep === 2 && ' Analyzing dishes...'}
        {currentStep === 3 && ' Checking allergens...'}
        {currentStep === 4 && ' ✅ Complete!'}
      </div>
    </div>
  );
};
```

---

## ⚡ Strategy 3: Traditional Sync (Simplest)

### **Timeline:**
```
0s    → Upload image
8-16s → Wait...
16s   → ✅ Full result returned
```

### **Backend Endpoint:**
- **POST** `/menu/upload/scan` - Traditional sync endpoint

### **Frontend Example:**

```typescript
const scanMenuTraditional = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('language', 'vi');
  formData.append('allergens', JSON.stringify([
    { type: 'shellfish', severity: 'severe' }
  ]));

  const response = await fetch('/menu/upload/scan', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Full result:', result);
  return result;
};
```

**⚠️ Drawback:** User waits 8-16s with no feedback.

---

## 📊 Performance Comparison

| Strategy | Time to First Render | Total Time | UX Quality | Complexity |
|----------|---------------------|------------|------------|------------|
| **SSE Streaming** | < 1s (jobId) | 8-16s | ⭐⭐⭐⭐⭐ Excellent | Medium |
| **Micro-endpoints** | 2-5s (extraction) | 8-16s | ⭐⭐⭐⭐ Good | Medium |
| **Traditional Sync** | 8-16s | 8-16s | ⭐⭐ Poor | Low |

---

## 🎯 Which Strategy to Use?

### **Use SSE Streaming when:**
- ✅ You want the best UX (progressive updates)
- ✅ You need real-time feedback
- ✅ Your frontend supports SSE (EventSource API)

### **Use Micro-endpoints when:**
- ✅ You want full control over timing
- ✅ You want to cache individual steps
- ✅ You want to retry failed steps independently

### **Use Traditional Sync when:**
- ✅ You have a simple use case
- ✅ Loading time (8-16s) is acceptable
- ✅ You want minimal frontend complexity

---

## 🔧 Advanced: Polling Fallback (for SSE incompatibility)

```typescript
// Fallback for browsers/environments that don't support SSE
const pollJobStatus = async (jobId: string) => {
  const poll = async () => {
    const response = await fetch(`/menu/jobs/${jobId}`);
    const job = await response.json();

    console.log('Job status:', job.status);

    if (job.status === 'completed') {
      console.log('✅ Job completed!', job.result);
      return job.result;
    }

    if (job.status === 'failed') {
      throw new Error(job.error);
    }

    // Poll every 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    return poll();
  };

  return poll();
};
```

---

## 📝 Summary

TasteBuddyAI cung cấp 3 strategies để bạn chọn phù hợp với use case:

1. **SSE Streaming** → Best UX, progressive updates (recommended)
2. **Micro-endpoints** → Flexible, cacheable, full control
3. **Traditional Sync** → Simplest, but poor UX

**Recommendation:** Use **SSE Streaming** for production để đạt UX tốt nhất! 🚀
