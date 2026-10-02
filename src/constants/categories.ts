export const CATEGORIES = {
  FOOD: 'Gıda',
  DINING: 'Yeme & İçme',
  TRANSPORT: 'Ulaşım',
  CLEANING: 'Temizlik',
  PERSONAL_CARE: 'Kişisel Bakım',
  HOME: 'Ev',
  ENTERTAINMENT: 'Eğlence',
  SHOPPING: 'Alışveriş',
  BILLS: 'Faturalar',
  OTHER: 'Diğer',
};

export const CATEGORY_IDS: Record<keyof typeof CATEGORIES, string> = {
  FOOD: 'cat_food',
  DINING: 'cat_dining',
  TRANSPORT: 'cat_transport',
  CLEANING: 'cat_cleaning',
  PERSONAL_CARE: 'cat_personal_care',
  HOME: 'cat_home',
  ENTERTAINMENT: 'cat_entertainment',
  SHOPPING: 'cat_shopping',
  BILLS: 'cat_bills',
  OTHER: 'cat_other',
};
