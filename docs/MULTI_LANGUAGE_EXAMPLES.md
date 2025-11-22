# Multi-Language Response Examples

This document demonstrates the multi-language support and currency conversion features.

## Supported Languages

| Code | Language | Currency | Exchange Rate (to VND) |
|------|----------|----------|------------------------|
| `vi` | Tiếng Việt 🇻🇳 | VND (₫) | 1 (base) |
| `en` | English 🇺🇸 | USD ($) | 1:25,000 |
| `ko` | 한국어 🇰🇷 | KRW (₩) | 1:19 |
| `ja` | 日本語 🇯🇵 | JPY (¥) | 1:167 |
| `de` | Deutsch 🇩🇪 | EUR (€) | 1:27,000 |
| `fr` | Français 🇫🇷 | EUR (€) | 1:27,000 |

---

## Example 1: Vietnamese Response (Default)

**Request:**
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "vi"
```

**Response:**
```json
{
  "success": true,
  "message": "Quét thực đơn hoàn tất",
  "language": "vi",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Món Chính",
          "items": [
            {
              "name": "Phở Bò",
              "description": "Phở bò truyền thống Hà Nội",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 50000,
              "priceFormatted": "50,000₫",
              "priceCurrency": "VND",
              "priceSymbol": "₫"
            },
            {
              "name": "Bún Chả",
              "description": "Bún chả Hà Nội",
              "priceOriginal": {
                "value": 45000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "45,000₫"
              },
              "price": 45000,
              "priceFormatted": "45,000₫",
              "priceCurrency": "VND",
              "priceSymbol": "₫"
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "translations": {
        "safe": "An toàn",
        "warning": "Cảnh báo",
        "danger": "Nguy hiểm",
        "contains": "Có chứa",
        "mayContain": "Có thể chứa",
        "free": "Không chứa"
      },
      "summary": {
        "safeItems": 1,
        "unsafeItems": 1
      }
    }
  },
  "meta": {
    "statusMessages": {
      "success": "Quét thực đơn hoàn tất",
      "extractionMethod": "cloud-vision",
      "dishesFound": 2,
      "dishesFoundMessage": "2 món đã tìm thấy"
    },
    "currency": {
      "code": "VND",
      "symbol": "₫",
      "name": "Vietnamese Dong",
      "exchangeRateToVND": 1
    },
    "locale": "vi-VN"
  }
}
```

---

## Example 2: English Response with USD

**Request:**
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "en"
```

**Response:**
```json
{
  "success": true,
  "message": "Menu scan completed successfully",
  "language": "en",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Main Dishes",
          "items": [
            {
              "name": "Phở Bò",
              "description": "Traditional Hanoi Beef Pho",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 2,
              "priceFormatted": "$2.00",
              "priceCurrency": "USD",
              "priceSymbol": "$"
            },
            {
              "name": "Bún Chả",
              "description": "Hanoi Grilled Pork with Noodles",
              "priceOriginal": {
                "value": 45000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "45,000₫"
              },
              "price": 1.8,
              "priceFormatted": "$1.80",
              "priceCurrency": "USD",
              "priceSymbol": "$"
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "translations": {
        "safe": "Safe",
        "warning": "Warning",
        "danger": "Danger",
        "contains": "Contains",
        "mayContain": "May contain",
        "free": "Free"
      },
      "summary": {
        "safeItems": 1,
        "unsafeItems": 1
      }
    }
  },
  "meta": {
    "statusMessages": {
      "success": "Menu scan completed successfully",
      "extractionMethod": "cloud-vision",
      "dishesFound": 2,
      "dishesFoundMessage": "2 dish(es) found"
    },
    "currency": {
      "code": "USD",
      "symbol": "$",
      "name": "US Dollar",
      "exchangeRateToVND": 25000
    },
    "locale": "en-US"
  }
}
```

---

## Example 3: Korean Response with KRW

**Request:**
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "ko"
```

**Response:**
```json
{
  "success": true,
  "message": "메뉴 스캔 완료",
  "language": "ko",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "메인 요리",
          "items": [
            {
              "name": "Phở Bò",
              "description": "전통 하노이 쇠고기 쌀국수",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 2632,
              "priceFormatted": "₩2,632",
              "priceCurrency": "KRW",
              "priceSymbol": "₩"
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "translations": {
        "safe": "안전",
        "warning": "경고",
        "danger": "위험",
        "contains": "포함",
        "mayContain": "포함 가능성",
        "free": "무함유"
      }
    }
  },
  "meta": {
    "statusMessages": {
      "success": "메뉴 스캔 완료",
      "extractionMethod": "cloud-vision",
      "dishesFound": 1,
      "dishesFoundMessage": "1개 요리 발견"
    },
    "currency": {
      "code": "KRW",
      "symbol": "₩",
      "name": "South Korean Won",
      "exchangeRateToVND": 19
    },
    "locale": "ko-KR"
  }
}
```

---

## Example 4: Japanese Response with JPY

**Request:**
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "ja"
```

**Response:**
```json
{
  "success": true,
  "message": "メニュースキャン完了",
  "language": "ja",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "メイン料理",
          "items": [
            {
              "name": "Phở Bò",
              "description": "伝統的なハノイ牛肉フォー",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 299,
              "priceFormatted": "¥299",
              "priceCurrency": "JPY",
              "priceSymbol": "¥"
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "translations": {
        "safe": "安全",
        "warning": "警告",
        "danger": "危険",
        "contains": "含む",
        "mayContain": "含む可能性",
        "free": "不使用"
      }
    }
  },
  "meta": {
    "statusMessages": {
      "success": "メニュースキャン完了",
      "extractionMethod": "cloud-vision",
      "dishesFound": 1,
      "dishesFoundMessage": "1品の料理が見つかりました"
    },
    "currency": {
      "code": "JPY",
      "symbol": "¥",
      "name": "Japanese Yen",
      "exchangeRateToVND": 167
    },
    "locale": "ja-JP"
  }
}
```

---

## Example 5: German Response with EUR

**Request:**
```http
POST /menu/upload/scan
Content-Type: multipart/form-data

image: [menu.jpg]
language: "de"
```

**Response:**
```json
{
  "success": true,
  "message": "Menü-Scan erfolgreich abgeschlossen",
  "language": "de",
  "data": {
    "extraction": {
      "menuSections": [
        {
          "sectionName": "Hauptgerichte",
          "items": [
            {
              "name": "Phở Bò",
              "description": "Traditionelle Hanoi-Rindfleischsuppe",
              "priceOriginal": {
                "value": 50000,
                "currency": "VND",
                "symbol": "₫",
                "formatted": "50,000₫"
              },
              "price": 1.85,
              "priceFormatted": "€1.85",
              "priceCurrency": "EUR",
              "priceSymbol": "€"
            }
          ]
        }
      ]
    },
    "allergenAnalysis": {
      "translations": {
        "safe": "Sicher",
        "warning": "Warnung",
        "danger": "Gefahr",
        "contains": "Enthält",
        "mayContain": "Kann enthalten",
        "free": "Frei"
      }
    }
  },
  "meta": {
    "statusMessages": {
      "success": "Menü-Scan erfolgreich abgeschlossen",
      "extractionMethod": "cloud-vision",
      "dishesFound": 1,
      "dishesFoundMessage": "1 Gericht(e) gefunden"
    },
    "currency": {
      "code": "EUR",
      "symbol": "€",
      "name": "Euro",
      "exchangeRateToVND": 27000
    },
    "locale": "de-DE"
  }
}
```

---

## Price Conversion Examples

### Menu Item: Phở Bò (50,000 VND)

| Language | Price | Currency | Formatted |
|----------|-------|----------|-----------|
| Vietnamese | 50,000 | VND | 50,000₫ |
| English | 2.00 | USD | $2.00 |
| Korean | 2,632 | KRW | ₩2,632 |
| Japanese | 299 | JPY | ¥299 |
| German | 1.85 | EUR | €1.85 |
| French | 1.85 | EUR | €1.85 |

---

## Translation Keys Available

### Common Messages
- `common.success` - Success
- `common.error` - Error
- `common.warning` - Warning
- `common.info` - Information

### Menu Scanning
- `menu.scan.started` - Menu scan started
- `menu.scan.completed` - Menu scan completed successfully
- `menu.scan.failed` - Menu scan failed
- `menu.scan.no_dishes_found` - No dishes found in the image
- `menu.scan.dishes_found` - dish(es) found

### Allergen Safety
- `allergen.safe` - Safe
- `allergen.warning` - Warning
- `allergen.danger` - Danger
- `allergen.contains` - Contains
- `allergen.may_contain` - May contain
- `allergen.free` - Free

### Dietary Compliance
- `dietary.compliant` - Compliant
- `dietary.non_compliant` - Non-compliant
- `dietary.possibly_compliant` - Possibly compliant
- `dietary.unknown` - Unknown

---

## Usage in Frontend

```typescript
// Set language in request
const formData = new FormData();
formData.append('image', fileBlob);
formData.append('language', 'en'); // or 'vi', 'ko', 'ja', 'de', 'fr'

const response = await fetch('/menu/upload/scan', {
  method: 'POST',
  body: formData
});

const data = await response.json();

// Access translated messages
console.log(data.message); // "Menu scan completed successfully"
console.log(data.meta.statusMessages.dishesFoundMessage); // "2 dish(es) found"

// Access converted prices
data.data.extraction.menuSections[0].items.forEach(item => {
  console.log(item.priceFormatted); // "$2.00" (if language=en)
  console.log(item.priceOriginal.formatted); // "50,000₫" (always VND)
});

// Access translations for UI
const translations = data.data.allergenAnalysis.translations;
console.log(translations.safe); // "Safe" (if language=en)
console.log(translations.warning); // "Warning" (if language=en)
```

---

## Notes

1. **Base Currency**: All prices are stored in VND and converted based on language
2. **Exchange Rates**: Approximate rates, can be updated in `languages.constant.ts`
3. **Locale Formatting**: Uses `Intl.NumberFormat` for proper locale-specific formatting
4. **Fallback**: If language not supported, defaults to English (en)
5. **Original Price**: Always preserved in `priceOriginal` field for reference
