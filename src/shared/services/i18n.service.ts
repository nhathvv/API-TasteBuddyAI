import { Injectable } from '@nestjs/common';
import { getLanguage, getDefaultLanguage, Language } from '../constants/languages.constant';

/**
 * Translation keys for the application
 */
export interface TranslationKeys {
  // Common
  'common.success': string;
  'common.error': string;
  'common.warning': string;
  'common.info': string;

  // Menu scanning
  'menu.scan.started': string;
  'menu.scan.completed': string;
  'menu.scan.failed': string;
  'menu.scan.no_dishes_found': string;
  'menu.scan.dishes_found': string;

  // Allergen safety
  'allergen.safe': string;
  'allergen.warning': string;
  'allergen.danger': string;
  'allergen.contains': string;
  'allergen.may_contain': string;
  'allergen.free': string;
  'allergen.detected': string;
  'allergen.no_allergens_detected': string;
  'allergen.check_with_restaurant': string;

  // Dietary compliance
  'dietary.compliant': string;
  'dietary.non_compliant': string;
  'dietary.possibly_compliant': string;
  'dietary.unknown': string;

  // Nutrition
  'nutrition.calories': string;
  'nutrition.protein': string;
  'nutrition.carbs': string;
  'nutrition.fats': string;
  'nutrition.fiber': string;
  'nutrition.sodium': string;
  'nutrition.sugar': string;
  'nutrition.serving_size': string;

  // Status messages
  'status.processing': string;
  'status.analyzing': string;
  'status.extracting': string;
  'status.checking_safety': string;
  'status.completed': string;

  // Recommendations
  'recommendation.safe_to_eat': string;
  'recommendation.avoid': string;
  'recommendation.ask_staff': string;
  'recommendation.not_recommended': string;
}

/**
 * Translations database
 */
const translations: Record<string, TranslationKeys> = {
  en: {
    // Common
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',

    // Menu scanning
    'menu.scan.started': 'Menu scan started',
    'menu.scan.completed': 'Menu scan completed successfully',
    'menu.scan.failed': 'Menu scan failed',
    'menu.scan.no_dishes_found': 'No dishes found in the image',
    'menu.scan.dishes_found': 'dish(es) found',

    // Allergen safety
    'allergen.safe': 'Safe',
    'allergen.warning': 'Warning',
    'allergen.danger': 'Danger',
    'allergen.contains': 'Contains',
    'allergen.may_contain': 'May contain',
    'allergen.free': 'Free',
    'allergen.detected': 'Allergen detected',
    'allergen.no_allergens_detected': 'No allergens detected',
    'allergen.check_with_restaurant': 'Please verify with restaurant staff',

    // Dietary compliance
    'dietary.compliant': 'Compliant',
    'dietary.non_compliant': 'Non-compliant',
    'dietary.possibly_compliant': 'Possibly compliant',
    'dietary.unknown': 'Unknown',

    // Nutrition
    'nutrition.calories': 'Calories',
    'nutrition.protein': 'Protein',
    'nutrition.carbs': 'Carbs',
    'nutrition.fats': 'Fats',
    'nutrition.fiber': 'Fiber',
    'nutrition.sodium': 'Sodium',
    'nutrition.sugar': 'Sugar',
    'nutrition.serving_size': 'Serving size',

    // Status messages
    'status.processing': 'Processing...',
    'status.analyzing': 'Analyzing image...',
    'status.extracting': 'Extracting menu items...',
    'status.checking_safety': 'Checking allergen safety...',
    'status.completed': 'Completed',

    // Recommendations
    'recommendation.safe_to_eat': 'Safe to eat',
    'recommendation.avoid': 'Avoid this dish',
    'recommendation.ask_staff': 'Ask restaurant staff for details',
    'recommendation.not_recommended': 'Not recommended',
  },

  vi: {
    // Common
    'common.success': 'Thành công',
    'common.error': 'Lỗi',
    'common.warning': 'Cảnh báo',
    'common.info': 'Thông tin',

    // Menu scanning
    'menu.scan.started': 'Bắt đầu quét thực đơn',
    'menu.scan.completed': 'Quét thực đơn hoàn tất',
    'menu.scan.failed': 'Quét thực đơn thất bại',
    'menu.scan.no_dishes_found': 'Không tìm thấy món ăn trong ảnh',
    'menu.scan.dishes_found': 'món đã tìm thấy',

    // Allergen safety
    'allergen.safe': 'An toàn',
    'allergen.warning': 'Cảnh báo',
    'allergen.danger': 'Nguy hiểm',
    'allergen.contains': 'Có chứa',
    'allergen.may_contain': 'Có thể chứa',
    'allergen.free': 'Không chứa',
    'allergen.detected': 'Phát hiện chất gây dị ứng',
    'allergen.no_allergens_detected': 'Không phát hiện chất gây dị ứng',
    'allergen.check_with_restaurant': 'Vui lòng xác nhận với nhân viên nhà hàng',

    // Dietary compliance
    'dietary.compliant': 'Phù hợp',
    'dietary.non_compliant': 'Không phù hợp',
    'dietary.possibly_compliant': 'Có thể phù hợp',
    'dietary.unknown': 'Chưa xác định',

    // Nutrition
    'nutrition.calories': 'Calo',
    'nutrition.protein': 'Đạm',
    'nutrition.carbs': 'Tinh bột',
    'nutrition.fats': 'Chất béo',
    'nutrition.fiber': 'Chất xơ',
    'nutrition.sodium': 'Natri',
    'nutrition.sugar': 'Đường',
    'nutrition.serving_size': 'Khẩu phần',

    // Status messages
    'status.processing': 'Đang xử lý...',
    'status.analyzing': 'Đang phân tích hình ảnh...',
    'status.extracting': 'Đang trích xuất món ăn...',
    'status.checking_safety': 'Đang kiểm tra an toàn dị ứng...',
    'status.completed': 'Hoàn tất',

    // Recommendations
    'recommendation.safe_to_eat': 'An toàn để ăn',
    'recommendation.avoid': 'Tránh món này',
    'recommendation.ask_staff': 'Hỏi nhân viên để biết chi tiết',
    'recommendation.not_recommended': 'Không khuyến nghị',
  },

  ko: {
    // Common
    'common.success': '성공',
    'common.error': '오류',
    'common.warning': '경고',
    'common.info': '정보',

    // Menu scanning
    'menu.scan.started': '메뉴 스캔 시작',
    'menu.scan.completed': '메뉴 스캔 완료',
    'menu.scan.failed': '메뉴 스캔 실패',
    'menu.scan.no_dishes_found': '이미지에서 요리를 찾을 수 없습니다',
    'menu.scan.dishes_found': '개 요리 발견',

    // Allergen safety
    'allergen.safe': '안전',
    'allergen.warning': '경고',
    'allergen.danger': '위험',
    'allergen.contains': '포함',
    'allergen.may_contain': '포함 가능성',
    'allergen.free': '무함유',
    'allergen.detected': '알레르기 항원 감지',
    'allergen.no_allergens_detected': '알레르기 항원 미감지',
    'allergen.check_with_restaurant': '레스토랑 직원에게 확인하세요',

    // Dietary compliance
    'dietary.compliant': '적합',
    'dietary.non_compliant': '부적합',
    'dietary.possibly_compliant': '적합 가능성',
    'dietary.unknown': '알 수 없음',

    // Nutrition
    'nutrition.calories': '칼로리',
    'nutrition.protein': '단백질',
    'nutrition.carbs': '탄수화물',
    'nutrition.fats': '지방',
    'nutrition.fiber': '섬유질',
    'nutrition.sodium': '나트륨',
    'nutrition.sugar': '설탕',
    'nutrition.serving_size': '1회 제공량',

    // Status messages
    'status.processing': '처리 중...',
    'status.analyzing': '이미지 분석 중...',
    'status.extracting': '메뉴 항목 추출 중...',
    'status.checking_safety': '알레르기 안전성 확인 중...',
    'status.completed': '완료',

    // Recommendations
    'recommendation.safe_to_eat': '안전하게 섭취 가능',
    'recommendation.avoid': '이 요리를 피하세요',
    'recommendation.ask_staff': '직원에게 자세한 내용을 문의하세요',
    'recommendation.not_recommended': '권장하지 않음',
  },

  ja: {
    // Common
    'common.success': '成功',
    'common.error': 'エラー',
    'common.warning': '警告',
    'common.info': '情報',

    // Menu scanning
    'menu.scan.started': 'メニュースキャン開始',
    'menu.scan.completed': 'メニュースキャン完了',
    'menu.scan.failed': 'メニュースキャン失敗',
    'menu.scan.no_dishes_found': '画像から料理が見つかりませんでした',
    'menu.scan.dishes_found': '品の料理が見つかりました',

    // Allergen safety
    'allergen.safe': '安全',
    'allergen.warning': '警告',
    'allergen.danger': '危険',
    'allergen.contains': '含む',
    'allergen.may_contain': '含む可能性',
    'allergen.free': '不使用',
    'allergen.detected': 'アレルゲン検出',
    'allergen.no_allergens_detected': 'アレルゲン未検出',
    'allergen.check_with_restaurant': 'レストランスタッフにご確認ください',

    // Dietary compliance
    'dietary.compliant': '適合',
    'dietary.non_compliant': '不適合',
    'dietary.possibly_compliant': '適合の可能性',
    'dietary.unknown': '不明',

    // Nutrition
    'nutrition.calories': 'カロリー',
    'nutrition.protein': 'タンパク質',
    'nutrition.carbs': '炭水化物',
    'nutrition.fats': '脂質',
    'nutrition.fiber': '食物繊維',
    'nutrition.sodium': 'ナトリウム',
    'nutrition.sugar': '糖質',
    'nutrition.serving_size': '1食分',

    // Status messages
    'status.processing': '処理中...',
    'status.analyzing': '画像を分析中...',
    'status.extracting': 'メニュー項目を抽出中...',
    'status.checking_safety': 'アレルギー安全性を確認中...',
    'status.completed': '完了',

    // Recommendations
    'recommendation.safe_to_eat': '安全に食べられます',
    'recommendation.avoid': 'この料理は避けてください',
    'recommendation.ask_staff': 'スタッフに詳細をお尋ねください',
    'recommendation.not_recommended': '推奨されません',
  },

  de: {
    // Common
    'common.success': 'Erfolg',
    'common.error': 'Fehler',
    'common.warning': 'Warnung',
    'common.info': 'Information',

    // Menu scanning
    'menu.scan.started': 'Menü-Scan gestartet',
    'menu.scan.completed': 'Menü-Scan erfolgreich abgeschlossen',
    'menu.scan.failed': 'Menü-Scan fehlgeschlagen',
    'menu.scan.no_dishes_found': 'Keine Gerichte im Bild gefunden',
    'menu.scan.dishes_found': 'Gericht(e) gefunden',

    // Allergen safety
    'allergen.safe': 'Sicher',
    'allergen.warning': 'Warnung',
    'allergen.danger': 'Gefahr',
    'allergen.contains': 'Enthält',
    'allergen.may_contain': 'Kann enthalten',
    'allergen.free': 'Frei',
    'allergen.detected': 'Allergen erkannt',
    'allergen.no_allergens_detected': 'Keine Allergene erkannt',
    'allergen.check_with_restaurant': 'Bitte beim Restaurantpersonal nachfragen',

    // Dietary compliance
    'dietary.compliant': 'Konform',
    'dietary.non_compliant': 'Nicht konform',
    'dietary.possibly_compliant': 'Möglicherweise konform',
    'dietary.unknown': 'Unbekannt',

    // Nutrition
    'nutrition.calories': 'Kalorien',
    'nutrition.protein': 'Protein',
    'nutrition.carbs': 'Kohlenhydrate',
    'nutrition.fats': 'Fette',
    'nutrition.fiber': 'Ballaststoffe',
    'nutrition.sodium': 'Natrium',
    'nutrition.sugar': 'Zucker',
    'nutrition.serving_size': 'Portionsgröße',

    // Status messages
    'status.processing': 'Wird verarbeitet...',
    'status.analyzing': 'Bild wird analysiert...',
    'status.extracting': 'Menüpunkte werden extrahiert...',
    'status.checking_safety': 'Allergensicherheit wird überprüft...',
    'status.completed': 'Abgeschlossen',

    // Recommendations
    'recommendation.safe_to_eat': 'Sicher zu essen',
    'recommendation.avoid': 'Dieses Gericht vermeiden',
    'recommendation.ask_staff': 'Fragen Sie das Personal nach Details',
    'recommendation.not_recommended': 'Nicht empfohlen',
  },

  fr: {
    // Common
    'common.success': 'Succès',
    'common.error': 'Erreur',
    'common.warning': 'Avertissement',
    'common.info': 'Information',

    // Menu scanning
    'menu.scan.started': 'Analyse du menu commencée',
    'menu.scan.completed': 'Analyse du menu terminée',
    'menu.scan.failed': 'Échec de l\'analyse du menu',
    'menu.scan.no_dishes_found': 'Aucun plat trouvé dans l\'image',
    'menu.scan.dishes_found': 'plat(s) trouvé(s)',

    // Allergen safety
    'allergen.safe': 'Sûr',
    'allergen.warning': 'Avertissement',
    'allergen.danger': 'Danger',
    'allergen.contains': 'Contient',
    'allergen.may_contain': 'Peut contenir',
    'allergen.free': 'Sans',
    'allergen.detected': 'Allergène détecté',
    'allergen.no_allergens_detected': 'Aucun allergène détecté',
    'allergen.check_with_restaurant': 'Veuillez vérifier avec le personnel du restaurant',

    // Dietary compliance
    'dietary.compliant': 'Conforme',
    'dietary.non_compliant': 'Non conforme',
    'dietary.possibly_compliant': 'Possiblement conforme',
    'dietary.unknown': 'Inconnu',

    // Nutrition
    'nutrition.calories': 'Calories',
    'nutrition.protein': 'Protéines',
    'nutrition.carbs': 'Glucides',
    'nutrition.fats': 'Lipides',
    'nutrition.fiber': 'Fibres',
    'nutrition.sodium': 'Sodium',
    'nutrition.sugar': 'Sucre',
    'nutrition.serving_size': 'Portion',

    // Status messages
    'status.processing': 'Traitement en cours...',
    'status.analyzing': 'Analyse de l\'image...',
    'status.extracting': 'Extraction des éléments du menu...',
    'status.checking_safety': 'Vérification de la sécurité allergène...',
    'status.completed': 'Terminé',

    // Recommendations
    'recommendation.safe_to_eat': 'Peut être consommé en toute sécurité',
    'recommendation.avoid': 'Éviter ce plat',
    'recommendation.ask_staff': 'Demandez plus de détails au personnel',
    'recommendation.not_recommended': 'Non recommandé',
  },
};

/**
 * I18n Service for multi-language support
 */
@Injectable()
export class I18nService {
  private currentLanguage: Language;

  constructor() {
    this.currentLanguage = getDefaultLanguage();
  }

  /**
   * Set current language
   */
  setLanguage(languageCode: string): void {
    const lang = getLanguage(languageCode);
    if (lang) {
      this.currentLanguage = lang;
    }
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Translate a key
   */
  t(key: keyof TranslationKeys, languageCode?: string): string {
    const lang = languageCode || this.currentLanguage.code;
    const langTranslations = translations[lang] || translations['en'];
    return langTranslations[key] || key;
  }

  /**
   * Translate with parameters
   */
  tp(key: keyof TranslationKeys, params: Record<string, string | number>, languageCode?: string): string {
    let translated = this.t(key, languageCode);
    Object.keys(params).forEach((param) => {
      translated = translated.replace(`{${param}}`, String(params[param]));
    });
    return translated;
  }

  /**
   * Convert price from VND to target currency
   */
  convertPrice(priceInVND: number, targetLanguageCode?: string): {
    value: number;
    currency: string;
    symbol: string;
    formatted: string;
  } {
    const lang = targetLanguageCode ? getLanguage(targetLanguageCode) : this.currentLanguage;
    if (!lang) {
      return {
        value: priceInVND,
        currency: 'VND',
        symbol: '₫',
        formatted: `${priceInVND.toLocaleString('vi-VN')}₫`,
      };
    }

    const convertedValue = Math.round(priceInVND / lang.currency.exchangeRateToVND);

    return {
      value: convertedValue,
      currency: lang.currency.code,
      symbol: lang.currency.symbol,
      formatted: this.formatPrice(convertedValue, lang),
    };
  }

  /**
   * Format price according to language locale
   */
  private formatPrice(value: number, lang: Language): string {
    const formatter = new Intl.NumberFormat(lang.locale, {
      style: 'currency',
      currency: lang.currency.code,
      minimumFractionDigits: lang.currency.code === 'VND' ? 0 : 2,
      maximumFractionDigits: lang.currency.code === 'VND' ? 0 : 2,
    });

    return formatter.format(value);
  }

  /**
   * Get price in multiple currencies
   */
  getPriceInAllCurrencies(priceInVND: number): Array<{
    language: string;
    value: number;
    currency: string;
    symbol: string;
    formatted: string;
  }> {
    const languages = ['en', 'vi', 'ko', 'ja', 'de', 'fr'];
    return languages.map((langCode) => {
      const price = this.convertPrice(priceInVND, langCode);
      return {
        language: langCode,
        ...price,
      };
    });
  }
}
