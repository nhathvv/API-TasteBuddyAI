# 🎨 Frontend Integration Guide - TasteBuddy AI

**Version:** 1.0  
**Updated:** Nov 23, 2025

## 📋 Overview

Hướng dẫn đầy đủ cho Frontend team tích hợp API TasteBuddy AI và hiển thị kết quả phân tích món ăn.

---

## 🚀 Quick Start

### **Step 1: Upload & Scan Menu**

```javascript
// Upload ảnh menu
const scanMenu = async (imageFile, userAllergens = []) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('language', 'vi');
  formData.append('outputLanguage', 'vi');
  
  // Nếu user có dị ứng
  if (userAllergens.length > 0) {
    formData.append('userAllergens', JSON.stringify(userAllergens));
    formData.append('strictAllergenMode', 'true');
  }

  const response = await fetch('http://localhost:3000/menu/upload/scan-async', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return data.jobId; // "job_1763838581864_v3qlk4cyx"
};
```

### **Step 2: Poll Job Status**

```javascript
const pollJobStatus = async (jobId) => {
  const response = await fetch(`http://localhost:3000/menu/job/${jobId}/status`);
  const status = await response.json();
  
  console.log('📊 Job Status:', status);
  console.log(`Progress: ${status.progress?.percentage}%`);
  console.log(`Current Stage: ${status.currentStage}`);
  
  return status;
};
```

### **Step 3: Get & Display Results**

```javascript
const displayResults = async (jobId) => {
  const response = await fetch(`http://localhost:3000/menu/job/${jobId}/status`);
  const data = await response.json();
  
  if (data.status === 'completed' && data.result) {
    // Display dishes, allergens, prices
    displayDishes(data.result.data);
  }
};
```

---

## 📡 API Endpoints

### **1. POST /menu/upload/scan-async**

Upload ảnh và bắt đầu phân tích async.

**Request:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('language', 'vi');
formData.append('outputLanguage', 'vi');
formData.append('userAllergens', JSON.stringify([
  { type: 'shellfish', severity: 'severe' },
  { type: 'peanuts', severity: 'moderate' }
]));
```

**Response:**
```json
{
  "jobId": "job_1763838581864_v3qlk4cyx",
  "status": "processing",
  "message": "Job started successfully"
}
```

---

### **2. GET /menu/job/:jobId/status**

Get job status với progress và stages.

**Response:**
```json
{
  "jobId": "job_1763838581864_v3qlk4cyx",
  "status": "completed",
  "currentStage": "formatting",
  "createdAt": 1732310000000,
  "updatedAt": 1732310015234,
  
  "progress": {
    "totalStages": 8,
    "completedStages": 6,
    "failedStages": 0,
    "pendingStages": 2,
    "percentage": 75
  },
  
  "stages": [
    {
      "name": "validation",
      "status": "completed",
      "duration": 150
    },
    {
      "name": "extraction",
      "status": "completed",
      "duration": 5000
    },
    {
      "name": "dish_understanding",
      "status": "completed",
      "duration": 3500
    },
    {
      "name": "allergen_analysis",
      "status": "completed",
      "duration": 4000
    }
  ],
  
  "result": {
    // Full result data (nếu completed)
    "success": true,
    "data": {
      "extraction": { /* dishes */ },
      "allergenAnalysis": { /* allergen details */ }
    }
  },
  
  "metrics": {
    "totalDuration": 15234,
    "averageStageDuration": 2539
  }
}
```

---

### **3. GET /menu/job/:jobId/progress (SSE)**

Real-time progress updates qua Server-Sent Events.

```javascript
const streamProgress = (jobId) => {
  const eventSource = new EventSource(
    `http://localhost:3000/menu/job/${jobId}/progress`
  );
  
  eventSource.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log('📡 Update:', update);
    
    if (update.type === 'stage_update') {
      console.log(`Stage ${update.stage}: ${update.status}`);
    }
    
    if (update.type === 'job_completed') {
      eventSource.close();
      console.log('✅ Job completed!');
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('❌ SSE Error:', error);
    eventSource.close();
  };
};
```

---

## 🎨 Complete React Example

```jsx
import React, { useState, useEffect } from 'react';

const MenuAnalyzer = () => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Upload & start analysis
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', 'vi');
    formData.append('outputLanguage', 'vi');
    
    // User allergens
    formData.append('userAllergens', JSON.stringify([
      { type: 'shellfish', severity: 'severe' }
    ]));

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/menu/upload/scan-async', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setJobId(data.jobId);
      
      // Start polling
      pollStatus(data.jobId);
    } catch (error) {
      console.error('Upload failed:', error);
      setLoading(false);
    }
  };

  // Poll job status
  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/menu/job/${id}/status`);
        const data = await response.json();
        
        setStatus(data);
        
        console.log('═══════════════════════════════════════');
        console.log('📊 JOB STATUS UPDATE');
        console.log('═══════════════════════════════════════');
        console.log(`Status: ${data.status}`);
        console.log(`Progress: ${data.progress?.percentage}%`);
        console.log(`Current Stage: ${data.currentStage}`);
        console.log('Stages:', data.stages);
        console.log('═══════════════════════════════════════');
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setResult(data.result);
          setLoading(false);
          
          // Log full result
          console.log('✅ JOB COMPLETED - FULL RESULT:');
          console.log(JSON.stringify(data.result, null, 2));
        }
        
        if (data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          console.error('❌ Job failed:', data.error);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="menu-analyzer">
      <h1>🍜 Menu Analyzer</h1>
      
      {/* Upload */}
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={loading}
        />
      </div>

      {/* Progress */}
      {loading && status && (
        <div className="progress-section">
          <h2>📊 Progress</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${status.progress?.percentage}%` }}
            >
              {status.progress?.percentage}%
            </div>
          </div>
          <p>Current Stage: {status.currentStage}</p>
          
          {/* Stage Details */}
          <div className="stages">
            {status.stages?.map((stage, idx) => (
              <div key={idx} className={`stage stage-${stage.status}`}>
                <span className="stage-icon">
                  {stage.status === 'completed' ? '✅' : 
                   stage.status === 'processing' ? '⏳' : 
                   stage.status === 'failed' ? '❌' : '⭕'}
                </span>
                <span className="stage-name">{stage.name}</span>
                <span className="stage-duration">{stage.duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="results-section">
          <h2>✅ Analysis Complete</h2>
          
          {/* Dishes */}
          <DishesDisplay data={result.data.extraction} />
          
          {/* Allergen Analysis */}
          {result.data.allergenAnalysis && (
            <AllergenDisplay data={result.data.allergenAnalysis} />
          )}
        </div>
      )}
    </div>
  );
};

// Dishes Display Component
const DishesDisplay = ({ data }) => {
  if (!data?.menuSections) return null;
  
  console.log('🍽️ DISHES DATA:');
  console.log(JSON.stringify(data.menuSections, null, 2));
  
  return (
    <div className="dishes-display">
      <h3>🍽️ Món ăn ({data.metadata?.totalItems} món)</h3>
      
      {data.menuSections.map((section, idx) => (
        <div key={idx} className="menu-section">
          <h4>{section.sectionName}</h4>
          
          {section.items.map((item, itemIdx) => (
            <div key={itemIdx} className="dish-item">
              <div className="dish-header">
                <span className="dish-name">{item.name}</span>
                {item.price > 0 && (
                  <span className="dish-price">
                    {item.priceFormatted || `${item.price.toLocaleString('vi-VN')}₫`}
                  </span>
                )}
              </div>
              
              {item.description && (
                <p className="dish-description">{item.description}</p>
              )}
              
              {/* Nutrition Info */}
              {item.nutrition && (
                <div className="dish-nutrition">
                  <h5>📊 Thông tin dinh dưỡng:</h5>
                  <div className="nutrition-grid">
                    <div className="nutrient">
                      <span>🔥 {item.nutrition.calories} kcal</span>
                    </div>
                    <div className="nutrient">
                      <span>🥩 Protein: {item.nutrition.protein}g</span>
                    </div>
                    <div className="nutrient">
                      <span>🍚 Carbs: {item.nutrition.carbs}g</span>
                    </div>
                    <div className="nutrient">
                      <span>🥑 Fat: {item.nutrition.fat}g</span>
                    </div>
                  </div>
                  <p className="serving-size">📏 {item.nutrition.servingSize}</p>
                </div>
              )}
              
              {/* Dish Details (from DUIA) */}
              {item.dishDetails && (
                <div className="dish-details">
                  <p><strong>Thành phần:</strong> {
                    item.dishDetails.ingredients?.map(i => i.name).join(', ')
                  }</p>
                  {item.dishDetails.allergenSignals?.length > 0 && (
                    <p className="allergen-signals">
                      ⚠️ Tín hiệu dị ứng: {item.dishDetails.allergenSignals.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Allergen Display Component
const AllergenDisplay = ({ data }) => {
  console.log('🚨 ALLERGEN ANALYSIS:');
  console.log(JSON.stringify(data, null, 2));
  
  return (
    <div className="allergen-display">
      <h3>🚨 Phân tích dị ứng</h3>
      
      {/* Summary */}
      <div className="allergen-summary">
        <div className="stat">
          <span className="stat-value">{data.summary.safeItems}</span>
          <span className="stat-label">✅ An toàn</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.summary.warningItems}</span>
          <span className="stat-label">⚠️ Cảnh báo</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.summary.unsafeItems}</span>
          <span className="stat-label">🔴 Không an toàn</span>
        </div>
      </div>
      
      {/* Details per dish */}
      <div className="allergen-details">
        {data.analysis?.map((dish, idx) => (
          <div key={idx} className={`allergen-item risk-${dish.riskLevel}`}>
            <div className="dish-risk-header">
              <span className="risk-icon">
                {dish.riskLevel === 'SAFE' ? '✅' : 
                 dish.riskLevel === 'LOW_RISK' ? '🟢' :
                 dish.riskLevel === 'MEDIUM_RISK' ? '🟡' : '🔴'}
              </span>
              <span className="dish-name">{dish.dishName}</span>
              <span className="risk-level">{dish.riskLevel}</span>
            </div>
            
            {/* Identified Allergens */}
            {dish.identifiedAllergens?.length > 0 && (
              <div className="identified-allergens">
                <p><strong>Chất gây dị ứng:</strong></p>
                {dish.identifiedAllergens.map((allergen, aIdx) => (
                  <div key={aIdx} className="allergen-detail">
                    <div className="allergen-type">{allergen.allergen}</div>
                    <div className="allergen-source">Nguồn: {allergen.source}</div>
                    <div className="allergen-meta">
                      <span>Khả năng: {allergen.likelihood}</span>
                      <span>Mức độ: {allergen.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reasoning */}
            <p className="reasoning">{dish.reasoning}</p>
            
            {/* Recommendations */}
            {dish.recommendations?.length > 0 && (
              <div className="recommendations">
                <strong>Đề xuất:</strong>
                <ul>
                  {dish.recommendations.map((rec, rIdx) => (
                    <li key={rIdx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuAnalyzer;
```

---

## 📊 Console Logging Examples

### **Log Job Status**

```javascript
const logJobStatus = (status) => {
  console.log('═══════════════════════════════════════');
  console.log('📊 JOB STATUS');
  console.log('═══════════════════════════════════════');
  console.log(`Job ID: ${status.jobId}`);
  console.log(`Status: ${status.status}`);
  console.log(`Progress: ${status.progress?.percentage}%`);
  console.log(`\nStages:`);
  
  status.stages?.forEach(stage => {
    const icon = stage.status === 'completed' ? '✅' : 
                 stage.status === 'processing' ? '⏳' : 
                 stage.status === 'failed' ? '❌' : '⭕';
    console.log(`  ${icon} ${stage.name}: ${stage.status} (${stage.duration || 0}ms)`);
  });
  
  console.log(`\nMetrics:`);
  console.log(`  Total Duration: ${status.metrics?.totalDuration}ms`);
  console.log(`  Average Stage: ${status.metrics?.averageStageDuration}ms`);
  console.log('═══════════════════════════════════════');
};
```

### **Log Full Result**

```javascript
const logFullResult = (result) => {
  console.log('═══════════════════════════════════════');
  console.log('✅ ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════');
  
  // Dishes
  const dishes = result.data.extraction?.menuSections
    ?.flatMap(s => s.items) || [];
    
  console.log(`\n🍽️  Món ăn (${dishes.length} món):`);
  dishes.forEach((dish, idx) => {
    console.log(`\n${idx + 1}. ${dish.name}`);
    console.log(`   💰 Giá: ${dish.priceFormatted}`);
    if (dish.dishDetails?.ingredients) {
      console.log(`   📝 Thành phần: ${dish.dishDetails.ingredients.map(i => i.name).join(', ')}`);
    }
  });
  
  // Allergen Analysis
  if (result.data.allergenAnalysis) {
    const allergen = result.data.allergenAnalysis;
    console.log(`\n🚨 Phân tích dị ứng:`);
    console.log(`   ✅ An toàn: ${allergen.summary.safeItems} món`);
    console.log(`   ⚠️  Cảnh báo: ${allergen.summary.warningItems} món`);
    console.log(`   🔴 Không an toàn: ${allergen.summary.unsafeItems} món`);
    
    allergen.analysis?.forEach(dish => {
      if (dish.riskLevel !== 'SAFE') {
        console.log(`\n   ${dish.dishName}: ${dish.riskLevel}`);
        dish.identifiedAllergens?.forEach(a => {
          console.log(`      - ${a.allergen}: ${a.source} (${a.likelihood}, ${a.severity})`);
        });
      }
    });
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📄 Full JSON:');
  console.log(JSON.stringify(result, null, 2));
  console.log('═══════════════════════════════════════');
};
```

---

## 🎨 CSS Styles

```css
.menu-analyzer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  margin: 20px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  transition: width 0.3s ease;
}

/* Stages */
.stages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stage {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: #f5f5f5;
}

.stage-completed { background: #e8f5e9; }
.stage-processing { background: #fff3e0; animation: pulse 1.5s infinite; }
.stage-failed { background: #ffebee; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.stage-icon { margin-right: 10px; font-size: 20px; }
.stage-name { flex: 1; font-weight: 500; }
.stage-duration { color: #666; font-size: 14px; }

/* Dishes */
.dish-item {
  padding: 15px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dish-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.dish-price {
  font-size: 16px;
  font-weight: bold;
  color: #4CAF50;
}

.dish-description {
  color: #666;
  margin: 8px 0;
}

.dish-details {
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 14px;
}

.allergen-signals {
  color: #ff9800;
  margin-top: 5px;
}

/* Allergen Display */
.allergen-summary {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  display: block;
  margin-top: 5px;
  color: #666;
}

.allergen-item {
  margin: 15px 0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid;
}

.risk-SAFE { border-left-color: #4CAF50; background: #e8f5e9; }
.risk-LOW_RISK { border-left-color: #8BC34A; background: #f1f8e9; }
.risk-MEDIUM_RISK { border-left-color: #FFC107; background: #fff8e1; }
.risk-HIGH_RISK { border-left-color: #FF5722; background: #fbe9e7; }
.risk-SEVERE_RISK { border-left-color: #F44336; background: #ffebee; }

.dish-risk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.risk-level {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.1);
  font-size: 12px;
  font-weight: 600;
}

.identified-allergens {
  margin: 15px 0;
}

.allergen-detail {
  margin: 10px 0;
  padding: 10px;
  background: rgba(255,255,255,0.5);
  border-radius: 4px;
}

.allergen-type {
  font-weight: 600;
  color: #d32f2f;
  margin-bottom: 5px;
}

.allergen-source {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}

.allergen-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #999;
  margin-top: 5px;
}

.reasoning {
  margin: 10px 0;
  padding: 10px;
  background: rgba(0,0,0,0.02);
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: #555;
}

.recommendations {
  margin-top: 10px;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 14px;
}

.recommendations ul {
  margin: 5px 0;
  padding-left: 20px;
}
```

---

## 📱 Mobile Responsive

```css
@media (max-width: 768px) {
  .allergen-summary {
    flex-direction: column;
  }
  
  .dish-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .stages {
    font-size: 14px;
  }
  
  .stage-icon {
    font-size: 16px;
  }
}
```

---

## 🔔 Real-time Updates với SSE

```javascript
const useJobProgress = (jobId) => {
  const [updates, setUpdates] = useState([]);
  
  useEffect(() => {
    if (!jobId) return;
    
    const eventSource = new EventSource(
      `http://localhost:3000/menu/job/${jobId}/progress`
    );
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      // Log to console
      console.log('═══════════════════════════════════════');
      console.log(`📡 Real-time Update: ${update.type}`);
      console.log('═══════════════════════════════════════');
      console.log(update);
      console.log('═══════════════════════════════════════');
      
      setUpdates(prev => [...prev, update]);
      
      if (update.type === 'job_completed' || update.type === 'job_failed') {
        eventSource.close();
      }
    };
    
    return () => eventSource.close();
  }, [jobId]);
  
  return updates;
};
```

---

## ✅ Testing Checklist

- [ ] Upload ảnh menu thành công
- [ ] Nhận được jobId
- [ ] Progress bar hiển thị đúng %
- [ ] Stages update real-time
- [ ] Console log đầy đủ data
- [ ] Hiển thị tên món, giá
- [ ] Hiển thị thành phần món ăn
- [ ] Hiển thị allergen analysis
- [ ] Risk levels hiển thị đúng màu
- [ ] Responsive trên mobile

---

## 📞 Support

Nếu có vấn đề, check console logs:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG', 'true');
```

**Backend Logs Location:**
```
/Users/admin/API-TasteBuddyAI/logs/app.log
```

---

## 🎯 Summary

Tài liệu này cung cấp:
- ✅ API endpoints đầy đủ
- ✅ React component examples
- ✅ Console logging patterns
- ✅ CSS styling
- ✅ Real-time updates (SSE)
- ✅ Mobile responsive

**Happy Coding! 🚀**
