# Cloud Vision API - Service Account Setup Guide

## Problem: PERMISSION_DENIED Error

If you see this error:
```
PERMISSION_DENIED: Requests to this API vision.googleapis.com method google.cloud.vision.v1.ImageAnnotator.BatchAnnotateImages are blocked.
```

**Reason**: Cloud Vision API requires **Service Account credentials**, not just an API key.

## Solution: Setup Service Account

### Step 1: Enable Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Cloud Vision API"
5. Click **Enable**

### Step 2: Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `vision-api-service-account`
   - **Description**: "Service account for Cloud Vision API"
4. Click **Create and Continue**

### Step 3: Grant Permissions

1. Add role: **Cloud Vision API User**
2. Click **Continue**
3. Click **Done**

### Step 4: Create JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. The JSON file will be downloaded to your computer

### Step 5: Configure Environment Variable

**Option A: Set environment variable (Recommended for production)**

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"

# Windows (CMD)
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-service-account-key.json

# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-service-account-key.json"
```

**Option B: Add to .env file (Development)**

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=/Users/your-username/Downloads/service-account-key.json
```

### Step 6: Restart Server

```bash
npm run start:dev
```

## Verification

Test the endpoint:

```bash
curl -X POST http://localhost:3000/menu/upload/vision-test \
  -F "image=@test-image.jpg" \
  -F "features=TEXT_DETECTION,LABEL_DETECTION"
```

**Expected**: Should work without PERMISSION_DENIED error

## Alternative: Use Gemini Vision Instead

If you don't want to set up service account, you can use the existing **Visual Extraction Agent** which uses Gemini API (already configured):

```bash
# This already works with your existing GEMINI_API_KEY
POST /menu/upload/visual-extraction
```

## Troubleshooting

### Error: "Cannot find service account file"

**Solution**: Check the file path is correct and the file exists

```bash
# Verify file exists
ls -la /path/to/your-service-account-key.json
```

### Error: "Service account does not have required permissions"

**Solution**: Add the **Cloud Vision API User** role to the service account

1. Go to **IAM & Admin** > **IAM**
2. Find your service account
3. Click **Edit** (pencil icon)
4. Add role: **Cloud Vision API User**
5. Save

### Error: "API has not been enabled"

**Solution**: Enable Cloud Vision API in your project

1. Go to **APIs & Services** > **Library**
2. Search "Cloud Vision API"
3. Click **Enable**

## Security Best Practices

1. **Never commit** service account JSON to git
2. Add `*.json` to `.gitignore` for key files
3. Use environment variables for credentials
4. Rotate keys regularly
5. Use least privilege (only grant necessary roles)

## Cost Considerations

Cloud Vision API pricing (as of 2024):
- First 1,000 units/month: **Free**
- After that: $1.50 per 1,000 units

1 unit = 1 feature detection on 1 image

**Example**: Analyzing 100 images with TEXT_DETECTION + LABEL_DETECTION = 200 units (free tier)
