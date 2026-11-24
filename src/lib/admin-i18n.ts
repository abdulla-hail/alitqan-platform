/**
 * Admin interface strings (Arabic first, English available from the user menu).
 * Website content and website UI strings are NOT here — they live in the database.
 */
const ar = {
  dashboard: "لوحة المعلومات", content: "المحتوى", pages: "الصفحات", services: "الخدمات", service_categories: "تصنيفات الخدمات",
  projects: "المشاريع", project_categories: "تصنيفات المشاريع", blog_posts: "المقالات", blog_categories: "تصنيفات المدونة",
  blog_tags: "الوسوم", team_members: "فريق العمل", clients: "العملاء والشركاء", testimonials: "آراء العملاء", media: "مكتبة الوسائط",
  navigation: "القوائم والتذييل", inbox: "الطلبات والرسائل", requests: "طلبات المشاريع", messages: "رسائل التواصل",
  system: "النظام", brand: "الهوية البصرية", settings: "إعدادات الموقع", languages: "اللغات والترجمات", users: "المستخدمون",
  roles: "الأدوار والصلاحيات", activity: "سجل العمليات", account: "حسابي", logout: "تسجيل الخروج", view_site: "عرض الموقع",
  save: "حفظ", saving: "جارٍ الحفظ…", saved: "تم الحفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", add: "إضافة", new: "جديد",
  duplicate: "نسخ", search: "بحث…", all: "الكل", actions: "إجراءات", status: "الحالة", draft: "مسودة", published: "منشور",
  archived: "مؤرشف", visible: "ظاهر", hidden: "مخفي", show: "إظهار", hide: "إخفاء", publish: "نشر", unpublish: "إلغاء النشر",
  confirm_delete: "هل أنت متأكد من الحذف؟ لا يمكن التراجع.", no_items: "لا توجد عناصر بعد.", back: "رجوع", preview: "معاينة",
  drag_to_reorder: "اسحب لإعادة الترتيب", order_saved: "تم حفظ الترتيب", updated: "آخر تحديث", created: "تاريخ الإنشاء",
  error_generic: "حدث خطأ غير متوقع.", error_forbidden: "ليست لديك صلاحية لهذا الإجراء.", error_duplicate: "القيمة مستخدمة مسبقاً (مثل الرابط المختصر).",
  error_invalid: "بعض القيم غير صالحة.", error_auth: "انتهت الجلسة، سجّل الدخول مجدداً.", required: "مطلوب",
  content_tab: "المحتوى", media_tab: "الوسائط", seo_tab: "SEO", settings_tab: "الإعدادات", choose_image: "اختيار صورة",
  remove: "إزالة", upload: "رفع ملفات", uploading: "جارٍ الرفع…", add_item: "إضافة عنصر", sections: "الأقسام", add_section: "إضافة قسم",
  page_settings: "إعدادات الصفحة", edit_section: "تعديل القسم", login: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور",
  forgot_password: "نسيت كلمة المرور؟", send_reset: "إرسال رابط الاستعادة", reset_sent: "إذا كان البريد مسجلاً فستصلك رسالة لإعادة التعيين.",
  new_password: "كلمة المرور الجديدة", update_password: "تحديث كلمة المرور", invalid_login: "بيانات الدخول غير صحيحة أو الحساب غير مفعّل.",
  welcome: "مرحباً", seo_title: "عنوان SEO", seo_description: "وصف SEO", seo_image: "صورة المشاركة", language: "اللغة",
  export_csv: "تصدير CSV", export_xlsx: "تصدير Excel", notes: "ملاحظات داخلية", add_note: "إضافة ملاحظة", followup: "تاريخ المتابعة",
  priority: "الأولوية", assigned: "المسؤول", attachments: "المرفقات", details: "التفاصيل", open: "فتح", copy: "نسخ", copied: "تم النسخ",
  used_in: "مستخدم في", unused: "غير مستخدم", alt_text: "النص البديل", folder: "المجلد", size: "الحجم", type: "النوع",
  interface_language: "لغة الواجهة", theme: "المظهر", sample_content: "المحتوى التجريبي", total: "الإجمالي", new_items: "جديد",
  recent_activity: "آخر الأنشطة", quick_links: "روابط سريعة", content_stats: "إحصائيات المحتوى", denied: "ليست لديك صلاحية لفتح تلك الصفحة.",
};
export type AdminDict = typeof ar;
const en: AdminDict = {
  dashboard: "Dashboard", content: "Content", pages: "Pages", services: "Services", service_categories: "Service categories",
  projects: "Projects", project_categories: "Project categories", blog_posts: "Articles", blog_categories: "Blog categories",
  blog_tags: "Tags", team_members: "Team", clients: "Clients & partners", testimonials: "Testimonials", media: "Media library",
  navigation: "Menus & footer", inbox: "Inbox", requests: "Project requests", messages: "Contact messages",
  system: "System", brand: "Brand identity", settings: "Site settings", languages: "Languages & translations", users: "Users",
  roles: "Roles & permissions", activity: "Activity log", account: "My account", logout: "Sign out", view_site: "View site",
  save: "Save", saving: "Saving…", saved: "Saved", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add", new: "New",
  duplicate: "Duplicate", search: "Search…", all: "All", actions: "Actions", status: "Status", draft: "Draft", published: "Published",
  archived: "Archived", visible: "Visible", hidden: "Hidden", show: "Show", hide: "Hide", publish: "Publish", unpublish: "Unpublish",
  confirm_delete: "Delete this item? This cannot be undone.", no_items: "Nothing here yet.", back: "Back", preview: "Preview",
  drag_to_reorder: "Drag to reorder", order_saved: "Order saved", updated: "Updated", created: "Created",
  error_generic: "Something went wrong.", error_forbidden: "You don't have permission for this action.", error_duplicate: "That value is already used (e.g. the slug).",
  error_invalid: "Some values are invalid.", error_auth: "Your session expired, please sign in again.", required: "Required",
  content_tab: "Content", media_tab: "Media", seo_tab: "SEO", settings_tab: "Settings", choose_image: "Choose image",
  remove: "Remove", upload: "Upload files", uploading: "Uploading…", add_item: "Add item", sections: "Sections", add_section: "Add section",
  page_settings: "Page settings", edit_section: "Edit section", login: "Sign in", email: "Email", password: "Password",
  forgot_password: "Forgot password?", send_reset: "Send reset link", reset_sent: "If the email is registered, a reset link is on its way.",
  new_password: "New password", update_password: "Update password", invalid_login: "Invalid credentials or inactive account.",
  welcome: "Welcome", seo_title: "SEO title", seo_description: "SEO description", seo_image: "Share image", language: "Language",
  export_csv: "Export CSV", export_xlsx: "Export Excel", notes: "Internal notes", add_note: "Add note", followup: "Follow-up date",
  priority: "Priority", assigned: "Assignee", attachments: "Attachments", details: "Details", open: "Open", copy: "Copy", copied: "Copied",
  used_in: "Used in", unused: "Unused", alt_text: "Alt text", folder: "Folder", size: "Size", type: "Type",
  interface_language: "Interface language", theme: "Theme", sample_content: "Sample content", total: "Total", new_items: "New",
  recent_activity: "Recent activity", quick_links: "Quick links", content_stats: "Content stats", denied: "You don't have access to that page.",
};

export const ADMIN_DICTS = { ar, en };
export type AdminLocale = keyof typeof ADMIN_DICTS;

export function adminDict(locale: string): AdminDict {
  return ADMIN_DICTS[(locale as AdminLocale) in ADMIN_DICTS ? (locale as AdminLocale) : "ar"];
}

export function errorText(d: AdminDict, code: string) {
  const key = `error_${code}` as keyof AdminDict;
  return (d[key] as string | undefined) ?? code;
}
