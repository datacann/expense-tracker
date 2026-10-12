import { hasPremiumEntitlement, PREMIUM_ENTITLEMENT_ID } from './subscriptionAccess';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
assert(PREMIUM_ENTITLEMENT_ID === 'premium', 'Entitlement kimliği değişti');
assert(!hasPremiumEntitlement(null), 'Bilgi yokken Premium açılmamalı');
assert(!hasPremiumEntitlement({ entitlements: { active: {} } } as any), 'Aktif entitlement yokken Premium açılmamalı');
assert(hasPremiumEntitlement({ entitlements: { active: { premium: { identifier: 'premium' } } } } as any), 'Premium entitlement erişim sağlamalı');
