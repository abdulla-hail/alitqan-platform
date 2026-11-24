import { adminDict } from "@/lib/admin-i18n";

export function authStrings(locale: string): Record<string, string> {
  const d = adminDict(locale);
  const ar = locale !== "en";
  return {
    ...(d as unknown as Record<string, string>),
    confirm_password: ar ? "تأكيد كلمة المرور" : "Confirm password",
    password_rule: ar ? "10 أحرف على الأقل." : "At least 10 characters.",
    owner_password_rule: ar ? "12 حرفاً على الأقل. استخدم عبارة طويلة يصعب تخمينها." : "At least 12 characters. Use a long passphrase.",
    password_updated: ar ? "تم تحديث كلمة المرور." : "Password updated.",
    full_name: ar ? "الاسم الكامل" : "Full name",
    create_owner: ar ? "إنشاء حساب المالك" : "Create owner account",
    owner_created: ar ? "تم إنشاء حساب المالك. احذف SETUP_TOKEN من متغيرات البيئة الآن." : "Owner account created. Remove SETUP_TOKEN from your environment now.",
    setup_title: ar ? "إعداد حساب المالك" : "Owner setup",
    setup_sub: ar ? "تُستخدم هذه الصفحة مرة واحدة فقط لإنشاء أول مدير بصلاحيات كاملة." : "This page is used once to create the first full-access administrator.",
    login_sub: ar ? "لوحة تحكم الموقع" : "Website control panel",
    reset_title: ar ? "استعادة كلمة المرور" : "Reset password",
    e_invalid_login: d.invalid_login,
    e_rate: ar ? "محاولات كثيرة، حاول لاحقاً." : "Too many attempts, try later.",
    e_weak_password: ar ? "كلمة المرور قصيرة أو غير متطابقة." : "Password too short or does not match.",
    e_same_password: ar ? "اختر كلمة مرور مختلفة عن السابقة." : "Choose a different password.",
    e_auth: d.error_auth,
    e_invalid: ar ? "تحقق من الحقول (كلمة المرور 12 حرفاً على الأقل)." : "Check the fields (password ≥ 12 characters).",
    e_not_configured: ar ? "SETUP_TOKEN أو مفتاح الخدمة غير مضبوط في متغيرات البيئة." : "SETUP_TOKEN or service key is not configured.",
    e_bad_token: ar ? "رمز الإعداد غير صحيح." : "Wrong setup token.",
    e_exists: ar ? "يوجد حساب مالك بالفعل." : "An owner already exists.",
    e_email_taken: ar ? "البريد مستخدم لحساب آخر." : "Email already registered.",
    e_generic: d.error_generic,
  };
}
