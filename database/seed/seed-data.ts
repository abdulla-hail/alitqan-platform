/**
 * Initial content for ALITQAN. Everything here lands in the database and is fully
 * editable/deletable from the CMS. Rows marked is_demo can be wiped in one click
 * (Settings → Sample content). Testimonials and clients are FICTIONAL and labelled so;
 * no real company names or logos are used.
 *
 * Generate SQL:  node database/seed/build-seed.ts  → database/seed/seed.sql
 */
type T = { ar: string; en: string };
const t = (ar: string, en: string): T => ({ ar, en });

export const roles = [
  { key: "super_admin", name: t("المالك", "Super Admin"), description: t("صلاحيات كاملة", "Full access"), position: 0 },
  { key: "admin", name: t("مدير الموقع", "Admin"), description: t("إدارة الموقع والمستخدمين", "Manages site and users"), position: 1 },
  { key: "editor", name: t("محرر المحتوى", "Editor"), description: t("إدارة المحتوى", "Manages content"), position: 2 },
  { key: "viewer", name: t("مشاهد", "Viewer"), description: t("مشاهدة فقط", "Read only"), position: 3 },
];

export const permissions: [string, string, T][] = [
  ["dashboard.view", "general", t("عرض لوحة التحكم", "View dashboard")],
  ["pages.manage", "content", t("إدارة الصفحات والأقسام", "Manage pages & sections")],
  ["services.manage", "content", t("إدارة الخدمات", "Manage services")],
  ["projects.manage", "content", t("إدارة المشاريع", "Manage projects")],
  ["blog.manage", "content", t("إدارة المدونة", "Manage blog")],
  ["team.manage", "content", t("إدارة الفريق", "Manage team")],
  ["clients.manage", "content", t("إدارة العملاء", "Manage clients")],
  ["testimonials.manage", "content", t("إدارة آراء العملاء", "Manage testimonials")],
  ["media.manage", "content", t("إدارة مكتبة الوسائط", "Manage media library")],
  ["navigation.manage", "content", t("إدارة القوائم", "Manage menus")],
  ["inbox.view", "inbox", t("عرض الطلبات والرسائل", "View requests & messages")],
  ["inbox.manage", "inbox", t("متابعة الطلبات وتغيير حالتها", "Update requests")],
  ["inbox.delete", "inbox", t("حذف الطلبات والرسائل", "Delete requests")],
  ["inbox.export", "inbox", t("تصدير الطلبات", "Export requests")],
  ["brand.manage", "system", t("إدارة الهوية البصرية", "Manage brand identity")],
  ["settings.manage", "system", t("إدارة إعدادات الموقع", "Manage site settings")],
  ["languages.manage", "system", t("إدارة اللغات والترجمات", "Manage languages & translations")],
  ["users.manage", "system", t("إدارة المستخدمين", "Manage users")],
  ["roles.manage", "system", t("إدارة الأدوار والصلاحيات", "Manage roles & permissions")],
  ["activity.view", "system", t("عرض سجل العمليات", "View activity log")],
];

const contentPerms = ["dashboard.view", "pages.manage", "services.manage", "projects.manage", "blog.manage", "team.manage",
  "clients.manage", "testimonials.manage", "media.manage", "navigation.manage"];
export const rolePermissions: Record<string, string[]> = {
  admin: permissions.map((p) => p[0]).filter((k) => k !== "roles.manage"),
  editor: [...contentPerms, "inbox.view"],
  viewer: ["dashboard.view", "inbox.view"],
};

export const languages = [
  { code: "ar", name: "Arabic", native_name: "العربية", dir: "rtl", is_default: true, position: 0 },
  { code: "en", name: "English", native_name: "English", dir: "ltr", is_default: false, position: 1 },
];

/** UI strings (menus, buttons, system messages). Editable in CMS → Languages → Translations. */
export const translations: Record<string, T> = {
  "common.read_more": t("اقرأ المزيد", "Read more"),
  "common.view_all": t("عرض الكل", "View all"),
  "common.view_details": t("عرض التفاصيل", "View details"),
  "common.request_service": t("اطلب الخدمة", "Request this service"),
  "common.start_project": t("ابدأ مشروعك", "Start a project"),
  "common.back": t("رجوع", "Back"),
  "common.all": t("الكل", "All"),
  "common.search": t("بحث", "Search"),
  "common.skip_to_content": t("تخطَّ إلى المحتوى", "Skip to content"),
  "common.home": t("الرئيسية", "Home"),
  "theme.label": t("المظهر", "Theme"),
  "theme.light": t("فاتح", "Light"),
  "theme.dark": t("داكن", "Dark"),
  "theme.system": t("حسب النظام", "System"),
  "lang.label": t("اللغة", "Language"),
  "header.menu": t("القائمة", "Menu"),
  "header.close": t("إغلاق", "Close"),
  "footer.rights": t("جميع الحقوق محفوظة", "All rights reserved"),
  "footer.contact": t("تواصل معنا", "Get in touch"),
  "footer.follow": t("تابعنا", "Follow us"),
  "services.features": t("ما الذي تحصل عليه", "What you get"),
  "services.steps": t("مراحل التنفيذ", "How we deliver"),
  "services.technologies": t("التقنيات المستخدمة", "Technologies"),
  "services.faq": t("أسئلة شائعة", "Frequently asked"),
  "services.related": t("خدمات ذات صلة", "Related services"),
  "services.cta_title": t("جاهز للبدء؟", "Ready to start?"),
  "services.cta_text": t("أخبرنا عن مشروعك وسنعود إليك خلال يوم عمل.", "Tell us about your project and we will reply within one business day."),
  "projects.search_placeholder": t("ابحث في المشاريع…", "Search projects…"),
  "projects.no_results": t("لا توجد مشاريع مطابقة.", "No matching projects."),
  "projects.challenge": t("التحدي", "The challenge"),
  "projects.solution": t("الحل", "The solution"),
  "projects.results": t("النتائج", "Results"),
  "projects.services": t("الخدمات المنفذة", "Services delivered"),
  "projects.technologies": t("التقنيات", "Technologies"),
  "projects.visit": t("زيارة المشروع", "Visit project"),
  "projects.similar": t("مشاريع مشابهة", "Similar projects"),
  "projects.gallery": t("معرض الصور", "Gallery"),
  "projects.completed": t("تاريخ الإنجاز", "Completed"),
  "projects.type": t("نوع المشروع", "Project type"),
  "projects.client": t("العميل", "Client"),
  "team.founders": t("المؤسسون", "Founders"),
  "team.members": t("فريق العمل", "The team"),
  "blog.by": t("بقلم", "By"),
  "blog.min_read": t("دقائق قراءة", "min read"),
  "blog.related": t("مقالات ذات صلة", "Related articles"),
  "blog.no_posts": t("لا توجد مقالات بعد.", "No articles yet."),
  "blog.tags": t("الوسوم", "Tags"),
  "contact.email": t("البريد الإلكتروني", "Email"),
  "contact.phone": t("الهاتف", "Phone"),
  "contact.whatsapp": t("واتساب", "WhatsApp"),
  "contact.address": t("العنوان", "Address"),
  "contact.hours": t("ساعات العمل", "Working hours"),
  "contact.form_title": t("أرسل رسالة", "Send a message"),
  "contact.map": t("عرض على الخريطة", "View on map"),
  "form.name": t("الاسم الكامل", "Full name"),
  "form.email": t("البريد الإلكتروني", "Email"),
  "form.phone": t("رقم الهاتف", "Phone number"),
  "form.company": t("اسم الشركة", "Company"),
  "form.subject": t("الموضوع", "Subject"),
  "form.message": t("الرسالة", "Message"),
  "form.kind": t("نوع الطلب", "Request type"),
  "form.kind_project": t("مشروع جديد", "New project"),
  "form.kind_quote": t("عرض سعر", "Price quote"),
  "form.service": t("الخدمة المطلوبة", "Service needed"),
  "form.service_other": t("أخرى / غير متأكد", "Other / not sure"),
  "form.description": t("وصف المشروع", "Project description"),
  "form.description_hint": t("الأهداف، الجمهور، المزايا الأساسية، أي روابط مرجعية.", "Goals, audience, key features, any reference links."),
  "form.budget": t("الميزانية التقديرية (اختياري)", "Estimated budget (optional)"),
  "form.timeline": t("المدة المتوقعة", "Expected timeline"),
  "form.attachments": t("مرفقات (اختياري)", "Attachments (optional)"),
  "form.attachments_hint": t("حتى 5 ملفات، 10MB لكل ملف: PDF, Word, Excel, PowerPoint, صور, ZIP.", "Up to 5 files, 10 MB each: PDF, Word, Excel, PowerPoint, images, ZIP."),
  "form.consent": t("أوافق على سياسة الخصوصية ومعالجة بياناتي للرد على طلبي.", "I agree to the privacy policy and to my data being processed to answer my request."),
  "form.privacy_link": t("سياسة الخصوصية", "Privacy policy"),
  "form.select": t("اختر…", "Select…"),
  "form.submit": t("إرسال", "Send"),
  "form.submit_request": t("إرسال الطلب", "Submit request"),
  "form.sending": t("جارٍ الإرسال…", "Sending…"),
  "form.success_title": t("تم استلام طلبك", "We received your request"),
  "form.success_text": t("شكراً لك. سيتواصل معك فريقنا قريباً.", "Thank you. Our team will contact you shortly."),
  "form.reference": t("رقم المرجع", "Reference"),
  "form.message_sent": t("تم إرسال رسالتك بنجاح. شكراً لتواصلك.", "Your message was sent. Thank you for reaching out."),
  "form.error_generic": t("تعذر الإرسال، حاول مرة أخرى.", "Could not send. Please try again."),
  "form.error_rate": t("محاولات كثيرة. حاول بعد قليل.", "Too many attempts. Please try again later."),
  "form.error_validation": t("يرجى مراجعة الحقول المظللة.", "Please review the highlighted fields."),
  "form.error_file": t("ملف غير مسموح أو أكبر من الحد.", "File type not allowed or too large."),
  "form.required": t("مطلوب", "Required"),
  "form.invalid_email": t("بريد إلكتروني غير صالح", "Invalid email"),
  "error.404_title": t("الصفحة غير موجودة", "Page not found"),
  "error.404_text": t("ربما نُقلت الصفحة أو لم تعد متاحة.", "The page may have moved or no longer exists."),
  "error.go_home": t("العودة للرئيسية", "Back to home"),
  "common.scroll": t("انتقل للأسفل", "Scroll down"),
  "projects.view": t("عرض المشروع", "View project"),
  "slider.prev": t("المشروع السابق", "Previous project"),
  "slider.next": t("المشروع التالي", "Next project"),
  "slider.pause": t("إيقاف التشغيل التلقائي", "Pause autoplay"),
  "slider.play": t("تشغيل تلقائي", "Play autoplay"),
  "slider.region": t("معرض المشاريع", "Projects carousel"),
  "slider.slide": t("الشريحة", "Slide"),
  "slider.of": t("من", "of"),
};

export const settings: Record<string, { value: unknown; is_public?: boolean }> = {
  general: {
    value: {
      site_url: "https://alitqan.com",
      copyright: t("إتقان", "ALITQAN"),
    },
  },
  contact: {
    value: {
      email: "hello@alitqan.com",
      phones: ["+966 50 000 0000"],
      whatsapp: "+966500000000",
      address: t("الرياض، المملكة العربية السعودية", "Riyadh, Saudi Arabia"),
      hours: t("الأحد – الخميس، 9 صباحاً – 6 مساءً", "Sunday – Thursday, 9 am – 6 pm"),
      map_url: "",
    },
  },
  social: {
    value: { linkedin: "https://www.linkedin.com/", x: "https://x.com/", instagram: "https://www.instagram.com/", behance: "https://www.behance.net/", github: "", youtube: "", tiktok: "", facebook: "" },
  },
  seo: {
    value: {
      title_template: t("%s | إتقان", "%s | ALITQAN"),
      default_title: t("إتقان — حلول رقمية متقنة", "ALITQAN — Digital work, done precisely"),
      default_description: t(
        "إتقان شركة خدمات رقمية: تطوير المواقع والأنظمة، تصميم الهويات وتجربة المستخدم، الاستشارات التقنية، والتسويق الرقمي.",
        "ALITQAN is a digital studio: websites and systems, brand identity and UX, technology consulting, and digital marketing.",
      ),
      keywords: t("تطوير مواقع, برمجة أنظمة, هوية بصرية, تجربة مستخدم, تسويق رقمي", "web development, custom systems, brand identity, UX design, digital marketing"),
      twitter_handle: "",
      google_verification: "",
    },
  },
  forms: {
    value: {
      budgets: [t("أقل من 20,000 ريال", "Under SAR 20k"), t("20,000 – 50,000 ريال", "SAR 20k – 50k"), t("50,000 – 150,000 ريال", "SAR 50k – 150k"), t("أكثر من 150,000 ريال", "Over SAR 150k")],
      timelines: [t("خلال شهر", "Within a month"), t("1 – 3 أشهر", "1 – 3 months"), t("3 – 6 أشهر", "3 – 6 months"), t("مرن", "Flexible")],
    },
  },
  notifications: {
    is_public: false,
    value: { recipients: ["hello@alitqan.com"], reply_to: "", send_confirmation_to_customer: false },
  },
};

export const brand = {
  name: t("إتقان", "ALITQAN"),
  tagline: t("نُتقن التفاصيل لتكبر أعمالك", "Precision that grows your business"),
  description: t("شركة خدمات رقمية وتقنية وإبداعية", "A digital, technology and creative studio"),
  logo_mode: "builtin",
  default_theme: "system",
  radius: "14px",
  colors: {
    light: { primary: "#0B5D50", secondary: "#16324F", accent: "#C9963B", background: "#FAF8F4", surface: "#FFFFFF", foreground: "#0E1A1F", muted: "#5B6B70", border: "#E6E1D8" },
    dark: { primary: "#3CC7A8", secondary: "#9DB8D9", accent: "#E2B565", background: "#0B1215", surface: "#121C20", foreground: "#ECE9E2", muted: "#93A3A8", border: "#22313A" },
  },
  fonts: { display_ar: "Alexandria", body_ar: "IBM Plex Sans Arabic", display_en: "Sora", body_en: "Inter" },
};

export const serviceCategories = [
  { slug: "development", icon: "Code2", name: t("تطوير المواقع والأنظمة", "Websites & systems"), description: t("مواقع، تطبيقات ويب، أنظمة ومنصات مخصصة.", "Websites, web apps, custom systems and platforms.") },
  { slug: "design", icon: "PenTool", name: t("التصميم والإبداع", "Design & creative"), description: t("هويات بصرية، واجهات وتجربة مستخدم، ومحتوى رقمي.", "Brand identity, UI/UX and digital content.") },
  { slug: "consulting", icon: "Compass", name: t("الاستشارات والحلول التقنية", "Consulting & solutions"), description: t("تحليل المتطلبات، الأتمتة والتحول الرقمي.", "Requirements, automation and digital transformation.") },
  { slug: "marketing", icon: "Megaphone", name: t("التسويق الرقمي", "Digital marketing"), description: t("حملات، SEO، محتوى وتواصل اجتماعي.", "Campaigns, SEO, content and social media.") },
];

type Svc = { slug: string; cat: string; icon: string; title: T; excerpt: T; tech: string[]; featured?: boolean };
const svc: Svc[] = [
  { slug: "website-development", cat: "development", icon: "AppWindow", featured: true, title: t("تصميم وبرمجة المواقع", "Website design & development"), excerpt: t("مواقع سريعة ومتجاوبة تحكي قصتك وتحوّل الزائر إلى عميل.", "Fast, responsive websites that tell your story and convert visitors."), tech: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
  { slug: "web-applications", cat: "development", icon: "Layers", featured: true, title: t("تطوير تطبيقات الويب", "Web application development"), excerpt: t("تطبيقات ويب آمنة وقابلة للتوسع تخدم عملياتك اليومية.", "Secure, scalable web apps that run your daily operations."), tech: ["Next.js", "Supabase", "PostgreSQL", "Node.js"] },
  { slug: "management-systems", cat: "development", icon: "ServerCog", title: t("برمجة الأنظمة الإدارية والمخصصة", "Management & custom systems"), excerpt: t("أنظمة تُبنى على مقاس إجراءاتك بدل أن تتكيف أنت معها.", "Systems shaped around your processes, not the other way round."), tech: ["PostgreSQL", "TypeScript", "REST", "Docker"] },
  { slug: "ecommerce", cat: "development", icon: "ShoppingBag", title: t("المتاجر الإلكترونية", "E-commerce stores"), excerpt: t("متاجر موثوقة بتجربة شراء سلسة وربط بالدفع والشحن.", "Reliable stores with smooth checkout, payments and shipping."), tech: ["Next.js", "Stripe", "Moyasar", "Headless CMS"] },
  { slug: "integrations-api", cat: "development", icon: "Plug", title: t("تكامل الأنظمة وواجهات API", "Systems integration & APIs"), excerpt: t("نربط أنظمتك ببعضها لتتدفق البيانات دون إدخال يدوي.", "We connect your systems so data flows without manual entry."), tech: ["REST", "GraphQL", "Webhooks", "OAuth"] },
  { slug: "brand-identity", cat: "design", icon: "Shapes", featured: true, title: t("الهويات البصرية والشعارات", "Brand identity & logos"), excerpt: t("هوية أصيلة تبدأ من معنى اسمك وتنتهي بدليل استخدام متكامل.", "An original identity rooted in your name, delivered with full guidelines."), tech: ["Figma", "Illustrator", "Brand guidelines"] },
  { slug: "ui-ux-design", cat: "design", icon: "MousePointerClick", featured: true, title: t("تصميم واجهات وتجربة المستخدم", "UI & UX design"), excerpt: t("واجهات واضحة تُختبر مع المستخدمين قبل أن تُبرمج.", "Clear interfaces, tested with users before a line of code."), tech: ["Figma", "Prototyping", "Usability testing"] },
  { slug: "digital-content-design", cat: "design", icon: "Palette", title: t("التصميم الإعلاني والمحتوى الرقمي", "Advertising & digital content design"), excerpt: t("تصاميم إعلانية ومحتوى رقمي متسق مع هويتك.", "Campaign creatives and digital content consistent with your brand."), tech: ["Figma", "After Effects", "Photoshop"] },
  { slug: "technical-consulting", cat: "consulting", icon: "Compass", title: t("الاستشارات التقنية وتحليل المتطلبات", "Technical consulting & requirements"), excerpt: t("نحوّل الفكرة إلى متطلبات واضحة وخطة تنفيذ واقعية.", "We turn ideas into clear requirements and a realistic delivery plan."), tech: ["Discovery workshops", "User stories", "Architecture"] },
  { slug: "business-automation", cat: "consulting", icon: "Workflow", featured: true, title: t("أتمتة الأعمال والتحول الرقمي", "Business automation & digital transformation"), excerpt: t("نلغي الأعمال اليدوية المتكررة ونقيس أثر التحول.", "We remove repetitive manual work and measure the impact."), tech: ["n8n", "Zapier", "Python", "Dashboards"] },
  { slug: "seo", cat: "marketing", icon: "Search", title: t("تحسين محركات البحث SEO", "Search engine optimisation"), excerpt: t("ظهور أعلى في نتائج البحث بمحتوى وبنية تقنية سليمة.", "Higher rankings through sound technical structure and content."), tech: ["Search Console", "Ahrefs", "Schema.org"] },
  { slug: "performance-marketing", cat: "marketing", icon: "LineChart", title: t("الحملات الإعلانية والتسويق عبر المنصات", "Paid campaigns & social media"), excerpt: t("حملات مدروسة تُدار بالأرقام لا بالتخمين.", "Campaigns managed by numbers, not guesswork."), tech: ["Google Ads", "Meta Ads", "Snapchat Ads", "GA4"] },
];

export const services = svc.map((s, i) => ({
  ...s,
  position: i,
  body: t(
    `${s.excerpt.ar}\n\nنبدأ بفهم أهدافك وجمهورك، ثم نصمم الحل ونبنيه ونختبره معك على مراحل واضحة. تحصل على نتيجة قابلة للقياس ووثائق تسليم كاملة ودعم بعد الإطلاق.`,
    `${s.excerpt.en}\n\nWe start by understanding your goals and audience, then design, build and test the solution with you in clear stages. You get a measurable outcome, complete hand-over documentation and post-launch support.`,
  ),
  features: [
    { icon: "Ruler", title: t("تحليل دقيق", "Precise discovery"), text: t("نحدد النطاق والأولويات قبل البدء.", "Scope and priorities set before we start.") },
    { icon: "Gauge", title: t("أداء عالٍ", "High performance"), text: t("سرعة واستقرار يمكن قياسهما.", "Measurable speed and stability.") },
    { icon: "ShieldCheck", title: t("أمان مدمج", "Security built in"), text: t("أفضل الممارسات من اليوم الأول.", "Best practices from day one.") },
    { icon: "HeartHandshake", title: t("دعم بعد الإطلاق", "Post-launch support"), text: t("نبقى معك بعد التسليم.", "We stay with you after hand-over.") },
  ],
  steps: [
    { title: t("الاكتشاف", "Discovery"), text: t("ورشة لفهم الأهداف والمتطلبات.", "A workshop to understand goals and requirements.") },
    { title: t("التصميم", "Design"), text: t("نماذج أولية تُراجع معك.", "Prototypes reviewed with you.") },
    { title: t("التنفيذ", "Build"), text: t("تطوير على دفعات قصيرة مع عروض دورية.", "Short iterations with regular demos.") },
    { title: t("الإطلاق", "Launch"), text: t("اختبار، نشر، وقياس النتائج.", "Testing, release and measurement.") },
  ],
  faqs: [
    { question: t("كم تستغرق المدة؟", "How long does it take?"), answer: t("تعتمد على النطاق؛ نقدّم جدولاً زمنياً بعد جلسة الاكتشاف.", "It depends on scope; we share a timeline after discovery.") },
    { question: t("هل أمتلك الكود والملفات؟", "Do I own the code and files?"), answer: t("نعم، تُسلَّم لك جميع الملفات والحقوق عند الانتهاء.", "Yes, all files and rights are handed over to you.") },
  ],
}));

export const projectCategories = [
  { slug: "web", name: t("مواقع وتطبيقات", "Web & apps") },
  { slug: "systems", name: t("أنظمة", "Systems") },
  { slug: "branding", name: t("هوية بصرية", "Branding") },
  { slug: "marketing", name: t("تسويق", "Marketing") },
];

/** Demo artwork generated from the brand geometry (scripts/build-demo-art.ts) — replace with real images. */
const img = (seed: string) => `/demo/${seed}.svg`;
export const projects = [
  { slug: "rawafed-learning-platform", cat: "web", featured: true, title: t("منصة روافد التعليمية", "Rawafed learning platform"), client: t("روافد (مثال توضيحي)", "Rawafed (illustrative)"), type: t("منصة تعليمية", "Learning platform"), excerpt: t("منصة دورات عربية بنظام اشتراكات ولوحة للمدربين.", "An Arabic course platform with subscriptions and an instructor dashboard."), tech: ["Next.js", "Supabase", "Stripe"], services: ["web-applications", "ui-ux-design"], date: "2026-03-15" },
  { slug: "masar-logistics-system", cat: "systems", featured: true, title: t("نظام مسار للخدمات اللوجستية", "Masar logistics system"), client: t("مسار (مثال توضيحي)", "Masar (illustrative)"), type: t("نظام إداري", "Management system"), excerpt: t("نظام لتتبع الشحنات وإدارة الأسطول والفوترة.", "Shipment tracking, fleet management and invoicing."), tech: ["React", "PostgreSQL", "Node.js"], services: ["management-systems", "integrations-api"], date: "2025-11-02" },
  { slug: "nakhla-brand-identity", cat: "branding", featured: true, title: t("هوية نخلة للقهوة المختصة", "Nakhla specialty coffee identity"), client: t("نخلة (مثال توضيحي)", "Nakhla (illustrative)"), type: t("هوية بصرية", "Brand identity"), excerpt: t("هوية دافئة مستوحاة من سعف النخيل وطقوس الضيافة.", "A warm identity inspired by palm fronds and hospitality rituals."), tech: ["Figma", "Illustrator"], services: ["brand-identity"], date: "2025-08-20" },
  { slug: "souq-alhirfa-store", cat: "web", featured: true, title: t("متجر سوق الحرفة", "Souq Alhirfa store"), client: t("سوق الحرفة (مثال توضيحي)", "Souq Alhirfa (illustrative)"), type: t("متجر إلكتروني", "E-commerce"), excerpt: t("متجر للحرف اليدوية بتجربة شراء سريعة على الجوال.", "A handcrafts store with a fast mobile checkout."), tech: ["Next.js", "Moyasar", "Tailwind CSS"], services: ["ecommerce", "website-development"], date: "2026-01-10" },
  { slug: "afaq-clinic-automation", cat: "systems", title: t("أتمتة مواعيد عيادات آفاق", "Afaq clinics scheduling automation"), client: t("آفاق (مثال توضيحي)", "Afaq (illustrative)"), type: t("أتمتة أعمال", "Automation"), excerpt: t("حجوزات وتذكيرات تلقائية عبر واتساب وربط بالنظام الطبي.", "Bookings and WhatsApp reminders integrated with the clinic system."), tech: ["n8n", "WhatsApp API", "PostgreSQL"], services: ["business-automation", "integrations-api"], date: "2025-06-05" },
  { slug: "wadi-tourism-campaign", cat: "marketing", title: t("حملة وادي للسياحة", "Wadi tourism campaign"), client: t("وادي (مثال توضيحي)", "Wadi (illustrative)"), type: t("حملة رقمية", "Digital campaign"), excerpt: t("حملة موسمية متعددة المنصات مع صفحات هبوط مخصصة.", "A seasonal multi-platform campaign with dedicated landing pages."), tech: ["Meta Ads", "Google Ads", "GA4"], services: ["performance-marketing", "seo"], date: "2025-12-01" },
].map((p, i) => ({
  ...p,
  position: i,
  cover: img(p.slug),
  gallery: [img(`${p.slug}-1`), img(`${p.slug}-2`), img(`${p.slug}-3`)],
  body: t(`${p.excerpt.ar} هذا مشروع توضيحي يبيّن طريقة عرض الأعمال في الموقع ويمكن حذفه أو استبداله من لوحة التحكم.`, `${p.excerpt.en} This is an illustrative project showing how work is presented; delete or replace it from the CMS.`),
  challenge: t("كان العميل يعتمد على إجراءات يدوية متفرقة تبطئ النمو وتصعّب قياس الأداء.", "The client relied on scattered manual processes that slowed growth and made performance hard to measure."),
  solution: t("صممنا حلاً موحداً بواجهة واضحة، وأتمتنا الخطوات المتكررة، وربطنا البيانات بلوحة متابعة.", "We designed one unified solution with a clear interface, automated repetitive steps and connected data to a live dashboard."),
  results: t("انخفض وقت الإنجاز وارتفع رضا المستخدمين خلال الأشهر الأولى.", "Turnaround time dropped and user satisfaction rose within the first months."),
  metrics: [{ value: "−40%", label: t("وقت الإنجاز", "Turnaround time") }, { value: "+2.3×", label: t("التحويلات", "Conversions") }, { value: "99.9%", label: t("التوفر", "Uptime") }],
}));

export const team = [
  { slug: "founder-one", founder: true, name: t("عضو مؤسس (مثال)", "Founding member (sample)"), job: t("المؤسس والمدير التنفيذي", "Founder & CEO"), bio: t("يقود رؤية إتقان ويرافق العملاء من الفكرة إلى الإطلاق.", "Leads ALITQAN's vision and guides clients from idea to launch."), skills: ["Strategy", "Product", "Leadership"] },
  { slug: "design-lead", founder: true, name: t("قائدة التصميم (مثال)", "Design lead (sample)"), job: t("المديرة الإبداعية", "Creative director"), bio: t("تبني الهويات وتجارب الاستخدام بدقة وشغف بالتفاصيل.", "Builds identities and user experiences with a passion for detail."), skills: ["Branding", "UI/UX", "Art direction"] },
  { slug: "engineering-lead", founder: false, name: t("قائد الهندسة (مثال)", "Engineering lead (sample)"), job: t("مهندس برمجيات أول", "Senior software engineer"), bio: t("يصمم البنى التقنية القابلة للتوسع ويقود فريق التطوير.", "Designs scalable architectures and leads the development team."), skills: ["Next.js", "PostgreSQL", "Cloud"] },
  { slug: "marketing-lead", founder: false, name: t("قائدة التسويق (مثال)", "Marketing lead (sample)"), job: t("أخصائية تسويق رقمي", "Digital marketing specialist"), bio: t("تخطط الحملات وتقيس أثرها بالأرقام.", "Plans campaigns and measures their impact."), skills: ["SEO", "Paid media", "Analytics"] },
];

export const blogCategories = [
  { slug: "engineering", name: t("هندسة البرمجيات", "Engineering") },
  { slug: "design", name: t("التصميم", "Design") },
  { slug: "growth", name: t("النمو والتسويق", "Growth") },
];
export const blogTags = [
  { slug: "nextjs", name: t("Next.js", "Next.js") },
  { slug: "branding", name: t("الهوية", "Branding") },
  { slug: "seo", name: t("SEO", "SEO") },
  { slug: "automation", name: t("الأتمتة", "Automation") },
];
export const posts = [
  { slug: "why-precision-matters", cat: "design", tags: ["branding"], featured: true, title: t("لماذا يصنع الإتقان الفرق في منتجك الرقمي", "Why precision makes the difference in your digital product"), excerpt: t("التفاصيل الصغيرة هي ما يتذكره العميل. كيف نبني ثقافة إتقان في كل مشروع.", "Small details are what customers remember. How we build a culture of precision into every project.") },
  { slug: "choosing-tech-stack-2026", cat: "engineering", tags: ["nextjs"], title: t("كيف تختار التقنيات المناسبة لمشروعك في 2026", "How to choose the right tech stack for your project in 2026"), excerpt: t("معايير عملية لاختيار التقنيات دون الانجراف خلف الضجيج.", "Practical criteria for choosing technology without chasing hype.") },
  { slug: "seo-for-arabic-websites", cat: "growth", tags: ["seo"], title: t("أساسيات SEO للمواقع العربية", "SEO essentials for Arabic websites"), excerpt: t("من بنية الروابط إلى hreflang: ما تحتاجه ليظهر موقعك العربي.", "From URL structure to hreflang: what your Arabic site needs to rank.") },
  { slug: "automation-quick-wins", cat: "engineering", tags: ["automation"], title: t("خمس فرص أتمتة سريعة لأي شركة ناشئة", "Five quick automation wins for any startup"), excerpt: t("مهام يومية يمكن أتمتتها هذا الأسبوع لتوفير ساعات من العمل.", "Daily tasks you can automate this week to save hours of work.") },
].map((p, i) => ({
  ...p,
  cover: img(`blog-${p.slug}`),
  published_at: new Date(Date.UTC(2026, 9 - i, 12)).toISOString(),
  author: i % 2 === 0 ? "founder-one" : "engineering-lead",
  body: t(
    `${p.excerpt.ar}\n\n## الفكرة الأساسية\n\nهذا مقال تجريبي يوضح شكل المدونة. يمكنك تعديله أو حذفه من لوحة التحكم، وكتابة محتوى مستقل لكل لغة.\n\n- نقطة أولى واضحة\n- نقطة ثانية عملية\n- نقطة ثالثة قابلة للقياس\n\n> الإتقان ليس إضافة، بل طريقة عمل.\n\n## الخلاصة\n\nابدأ صغيراً، قِس كل شيء، وحسّن باستمرار.`,
    `${p.excerpt.en}\n\n## The core idea\n\nThis is a sample article that shows how the blog looks. Edit or delete it from the CMS, and write independent content for each language.\n\n- A clear first point\n- A practical second point\n- A measurable third point\n\n> Precision is not an add-on; it is a way of working.\n\n## Takeaway\n\nStart small, measure everything, and keep improving.`,
  ),
}));

export const testimonials = [
  { name: t("عميل توضيحي", "Illustrative client"), title: t("مدير منتج — شركة ناشئة (مثال)", "Product manager — startup (sample)"), quote: t("نص توضيحي لرأي عميل: الالتزام بالمواعيد ووضوح التواصل جعلا التجربة سهلة.", "Sample testimonial text: on-time delivery and clear communication made the experience easy."), rating: 5 },
  { name: t("عميلة توضيحية", "Illustrative client"), title: t("مؤسسة متجر إلكتروني (مثال)", "E-commerce founder (sample)"), quote: t("نص توضيحي: الهوية الجديدة غيّرت طريقة تقديمنا لأنفسنا.", "Sample text: the new identity changed how we present ourselves."), rating: 5 },
  { name: t("عميل توضيحي", "Illustrative client"), title: t("مدير عمليات (مثال)", "Operations manager (sample)"), quote: t("نص توضيحي: الأتمتة وفّرت على فريقنا ساعات كل أسبوع.", "Sample text: automation saved our team hours every week."), rating: 4 },
];

export const clients = ["Nawaa", "Sahm", "Ufuq", "Bayan", "Rukn", "Tharwa"].map((n, i) => ({
  name: t(["نواة", "سهم", "أفق", "بيان", "ركن", "ثروة"][i] + " (مثال)", `${n} (sample)`),
  description: t("شعار وهمي لأغراض العرض.", "Fictional logo for demonstration."),
}));

export const notificationTemplates = {
  project_request: { subject: t("طلب مشروع جديد {{reference}}", "New project request {{reference}}"), body: t("طلب جديد من {{name}} ({{email}})\nالخدمة: {{service}}\nالميزانية: {{budget}}\nالمدة: {{timeline}}\n\n{{description}}\n\nافتح لوحة التحكم: {{admin_url}}", "New request from {{name}} ({{email}})\nService: {{service}}\nBudget: {{budget}}\nTimeline: {{timeline}}\n\n{{description}}\n\nOpen the dashboard: {{admin_url}}") },
  quote_request: { subject: t("طلب عرض سعر {{reference}}", "Quote request {{reference}}"), body: t("طلب عرض سعر من {{name}} ({{email}})\nالخدمة: {{service}}\n\n{{description}}\n\n{{admin_url}}", "Quote request from {{name}} ({{email}})\nService: {{service}}\n\n{{description}}\n\n{{admin_url}}") },
  contact_message: { subject: t("رسالة تواصل جديدة من {{name}}", "New contact message from {{name}}"), body: t("{{name}} ({{email}}, {{phone}})\nالموضوع: {{subject}}\n\n{{message}}\n\n{{admin_url}}", "{{name}} ({{email}}, {{phone}})\nSubject: {{subject}}\n\n{{message}}\n\n{{admin_url}}") },
};

// ---------------------------------------------------------------- pages & sections
type Section = { type: string; content: Record<string, unknown>; settings?: Record<string, unknown> };
const H = (eyebrowAr: string, eyebrowEn: string, titleAr: string, titleEn: string, subAr = "", subEn = ""): Section => ({
  type: "page_header",
  content: { eyebrow: t(eyebrowAr, eyebrowEn), title: t(titleAr, titleEn), subtitle: t(subAr, subEn) },
  settings: { background: "measure" },
});

export const pages: { slug: string; kind: string; title: T; summary: T; sections: Section[] }[] = [
  {
    slug: "home", kind: "system", title: t("الرئيسية", "Home"), summary: t("", ""),
    sections: [
      { type: "hero", settings: { background: "measure" }, content: {
        eyebrow: t("استوديو رقمي · تقني · إبداعي", "Digital · Technology · Creative studio"),
        title: t("نحوّل أفكارك إلى منتجات رقمية مُتقنة", "We turn ideas into precisely crafted digital products"),
        subtitle: t("نصمم ونبرمج المواقع والأنظمة، ونبني الهويات، ونقود النمو الرقمي — بدقة في كل تفصيلة.", "We design and build websites and systems, craft brands, and drive digital growth — precise in every detail."),
        primary_label: t("ابدأ مشروعك", "Start a project"), primary_href: "/request",
        secondary_label: t("استعرض أعمالنا", "See our work"), secondary_href: "/projects",
        highlights: [{ text: t("تسليم على مراحل واضحة", "Clear, staged delivery") }, { text: t("ملكية كاملة للكود والملفات", "You own all code and files") }, { text: t("دعم بعد الإطلاق", "Post-launch support") }],
      } },
      { type: "services", content: { eyebrow: t("خدماتنا", "Services"), title: t("كل ما يحتاجه مشروعك الرقمي", "Everything your digital project needs"), subtitle: t("من الفكرة والهوية إلى المنتج والنمو.", "From idea and identity to product and growth."), limit: 6, link_label: t("كل الخدمات", "All services"), link_href: "/services" }, settings: { featured_only: true } },
      { type: "projects", content: { eyebrow: t("أعمالنا", "Work"), title: t("مشاريع مختارة", "Selected projects"), limit: 4, link_label: t("كل المشاريع", "All projects"), link_href: "/projects" }, settings: { featured_only: true, layout: "slider" } },
      { type: "about", content: {
        eyebrow: t("من نحن", "About"), title: t("الإتقان طريقة عمل، لا شعار", "Precision is how we work, not a slogan"),
        body: t("إتقان فريق من المهندسين والمصممين والمسوقين يجمعهم معيار واحد: أن يُنجز العمل كما يجب. نبدأ من فهم عميق لعملك، ونبني حلولاً قابلة للقياس والتوسع.", "ALITQAN is a team of engineers, designers and marketers who share one standard: work done properly. We start with a deep understanding of your business and build measurable, scalable solutions."),
        link_label: t("تعرّف علينا", "Get to know us"), link_href: "/about",
        highlights: [{ title: t("فهم قبل التنفيذ", "Understand first"), text: t("لا نكتب سطراً قبل أن نفهم الهدف.", "No code before the goal is clear.") }, { title: t("جودة قابلة للقياس", "Measurable quality"), text: t("معايير أداء وأمان واضحة.", "Clear performance and security standards.") }],
      } },
      { type: "features", settings: { background: "muted", columns: "4" }, content: { eyebrow: t("لماذا إتقان", "Why ALITQAN"), title: t("شريك يهتم بالتفاصيل كما تهتم بها", "A partner who cares about details as much as you do"), items: [
        { icon: "Ruler", title: t("دقة في التخطيط", "Precise planning"), text: t("نطاق واضح وجدول زمني واقعي.", "Clear scope and a realistic timeline.") },
        { icon: "Gauge", title: t("أداء وسرعة", "Speed & performance"), text: t("مواقع وأنظمة سريعة ومستقرة.", "Fast, stable sites and systems.") },
        { icon: "ShieldCheck", title: t("أمان من البداية", "Secure by default"), text: t("حماية البيانات جزء من التصميم.", "Data protection is part of the design.") },
        { icon: "MessageSquare", title: t("تواصل شفاف", "Transparent communication"), text: t("تحديثات منتظمة ونقطة اتصال واحدة.", "Regular updates and one point of contact.") },
      ] } },
      { type: "stats", content: { eyebrow: t("بالأرقام", "In numbers"), title: t("نتائج نفخر بها", "Results we are proud of"), items: [
        { value: "120+", label: t("مشروع منجز", "Projects delivered") }, { value: "40+", label: t("هوية بصرية", "Brand identities") }, { value: "98%", label: t("رضا العملاء", "Client satisfaction") }, { value: "8", label: t("سنوات خبرة", "Years of experience") },
      ] } },
      { type: "process", settings: { background: "muted" }, content: { eyebrow: t("آلية العمل", "Process"), title: t("من الفكرة إلى الإطلاق بخطوات واضحة", "From idea to launch, in clear steps"), items: [
        { title: t("دراسة الفكرة", "Discover the idea"), text: t("نفهم أهدافك وجمهورك وسوقك قبل أي قرار.", "We understand your goals, audience and market before any decision.") },
        { title: t("التخطيط والتحليل", "Plan & analyse"), text: t("نطاق واضح، أولويات، وخطة زمنية واقعية.", "Clear scope, priorities and a realistic timeline.") },
        { title: t("التصميم", "Design"), text: t("هوية وتجربة ونماذج أولية تُراجع معك.", "Identity, UX and prototypes reviewed with you.") },
        { title: t("التطوير", "Build"), text: t("تطوير على دفعات قصيرة مع عروض دورية.", "Short iterations with regular demos.") },
        { title: t("الاختبار", "Test"), text: t("اختبار الأداء والأمان والتجربة على كل الأجهزة.", "Performance, security and UX tested on every device.") },
        { title: t("الإطلاق والدعم", "Launch & support"), text: t("نشر، قياس، وتحسين مستمر بعد الإطلاق.", "Release, measure and keep improving after launch.") },
      ] } },
      { type: "tech", content: { eyebrow: t("التقنيات", "Technology"), title: t("أدوات حديثة ومجربة", "Modern, proven tools"), items: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Supabase", "Tailwind CSS", "Figma", "Vercel", "Docker", "GA4", "n8n"] } },
      { type: "testimonials", settings: { background: "muted" }, content: { eyebrow: t("آراء العملاء", "Testimonials"), title: t("ماذا يقولون عنا", "What clients say"), limit: 3 } },
      { type: "clients", content: { eyebrow: t("العملاء والشركاء", "Clients & partners"), title: t("يثقون بنا (أسماء توضيحية)", "They trust us (illustrative names)") } },
      { type: "faq", content: { eyebrow: t("أسئلة شائعة", "FAQ"), title: t("إجابات سريعة", "Quick answers"), items: [
        { question: t("كم تكلفة المشروع؟", "How much does a project cost?"), answer: t("تعتمد على النطاق. بعد جلسة الاكتشاف نرسل عرضاً مفصلاً.", "It depends on scope. After discovery we send a detailed proposal.") },
        { question: t("هل تعملون مع عملاء خارج المملكة؟", "Do you work with clients abroad?"), answer: t("نعم، نعمل عن بعد مع عملاء في عدة دول.", "Yes, we work remotely with clients in several countries.") },
        { question: t("هل أستطيع تعديل موقعي بنفسي؟", "Can I edit my website myself?"), answer: t("نعم، نسلّم لوحة تحكم سهلة وتدريباً عليها.", "Yes, we deliver an easy CMS and training.") },
      ] } },
      { type: "cta", settings: { background: "brand" }, content: { title: t("لديك فكرة؟ لنصنعها بإتقان.", "Have an idea? Let's build it precisely."), subtitle: t("أخبرنا عن مشروعك وسنعود إليك خلال يوم عمل.", "Tell us about your project and we'll reply within one business day."), primary_label: t("اطلب مشروعك", "Request a project"), primary_href: "/request", secondary_label: t("تواصل معنا", "Contact us"), secondary_href: "/contact" } },
    ],
  },
  {
    slug: "about", kind: "system", title: t("من نحن", "About us"), summary: t("قصة إتقان ورؤيتها وقيمها.", "ALITQAN's story, vision and values."),
    sections: [
      H("من نحن", "About us", "نصنع الأثر بإتقان", "We make an impact, precisely", "قصة بدأت بسؤال بسيط: لماذا لا يُنجز العمل الرقمي كما يجب؟", "A story that began with a simple question: why isn't digital work done properly?"),
      { type: "image_text", settings: { image_side: "end" }, content: { eyebrow: t("قصتنا", "Our story"), title: t("من فكرة إلى استوديو متكامل", "From an idea to a full studio"), body: t("بدأت إتقان من إيمان بأن الجودة ليست رفاهية. جمعنا المهندسين والمصممين والمسوقين تحت سقف واحد لنقدم حلولاً متكاملة بمعيار واحد.\n\nاليوم نعمل مع شركات ناشئة ومؤسسات لبناء منتجات رقمية يعتمد عليها.", "ALITQAN started from the belief that quality is not a luxury. We brought engineers, designers and marketers under one roof to deliver complete solutions to one standard.\n\nToday we work with startups and organisations to build digital products people rely on."), image: img("about-story") } },
      { type: "features", settings: { columns: "2", background: "muted" }, content: { eyebrow: t("الرؤية والرسالة", "Vision & mission"), title: t("إلى أين نتجه", "Where we are heading"), items: [
        { icon: "Eye", title: t("رؤيتنا", "Vision"), text: t("أن نكون المرجع العربي الأول في الحلول الرقمية المتقنة.", "To be the leading Arab reference for precisely crafted digital solutions.") },
        { icon: "Target", title: t("رسالتنا", "Mission"), text: t("تمكين الأعمال بمنتجات رقمية دقيقة وقابلة للنمو، تُبنى بشفافية وشراكة.", "Empower businesses with precise, scalable digital products built through transparency and partnership.") },
      ] } },
      { type: "features", settings: { columns: "4" }, content: { eyebrow: t("قيمنا", "Values"), title: t("ما نؤمن به", "What we believe in"), items: [
        { icon: "Ruler", title: t("الإتقان", "Precision"), text: t("نهتم بالتفاصيل التي لا يراها الآخرون.", "We care about details others miss.") },
        { icon: "BadgeCheck", title: t("الأمانة", "Integrity"), text: t("وعود واقعية والتزام بها.", "Realistic promises, kept.") },
        { icon: "Sparkles", title: t("الابتكار", "Innovation"), text: t("حلول حديثة لا قوالب مكررة.", "Modern solutions, not recycled templates.") },
        { icon: "Handshake", title: t("الشراكة", "Partnership"), text: t("نجاحك هو مقياس نجاحنا.", "Your success is our measure.") },
      ] } },
      { type: "process", content: { eyebrow: t("أهدافنا", "Goals"), title: t("ما نعمل على تحقيقه", "What we are working towards"), items: [
        { title: t("جودة عالمية", "World-class quality"), text: t("منتجات تنافس أفضل المعايير العالمية.", "Products that meet global standards.") },
        { title: t("محتوى عربي رقمي أفضل", "Better Arabic digital experiences"), text: t("تجارب عربية أصيلة لا مترجمة.", "Native Arabic experiences, not translations.") },
        { title: t("علاقات طويلة الأمد", "Long-term relationships"), text: t("نبقى شريكاً بعد الإطلاق.", "We remain a partner after launch.") },
      ] } },
      { type: "team", content: { eyebrow: t("المؤسسون", "Founders"), title: t("من يقف خلف إتقان", "The people behind ALITQAN"), limit: 4 }, settings: { founders_only: true, background: "muted" } },
      { type: "tech", content: { eyebrow: t("الخبرات والمهارات", "Expertise & skills"), title: t("خبرات متكاملة تحت سقف واحد", "Complete expertise under one roof"), items: ["Product strategy", "UX research", "UI design", "Branding", "Frontend", "Backend", "Cloud & DevOps", "SEO", "Paid media", "Automation"] } },
      { type: "cta", settings: { background: "brand" }, content: { title: t("لنعمل معاً", "Let's work together"), primary_label: t("ابدأ مشروعك", "Start a project"), primary_href: "/request" } },
    ],
  },
  { slug: "services", kind: "system", title: t("الخدمات", "Services"), summary: t("خدمات التطوير والتصميم والاستشارات والتسويق.", "Development, design, consulting and marketing services."), sections: [H("خدماتنا", "Services", "حلول متكاملة لكل مرحلة", "Complete solutions for every stage", "اختر الخدمة أو دعنا نقترح الأنسب لك.", "Pick a service, or let us suggest the right fit.")] },
  { slug: "projects", kind: "system", title: t("أعمالنا", "Our work"), summary: t("معرض مشاريع إتقان.", "ALITQAN portfolio."), sections: [H("أعمالنا", "Work", "مشاريع صُنعت بإتقان", "Projects built with precision", "نماذج من أعمالنا عبر المجالات.", "A selection of our work across disciplines.")] },
  { slug: "team", kind: "system", title: t("فريق العمل", "Team"), summary: t("تعرّف على فريق إتقان.", "Meet the ALITQAN team."), sections: [H("فريقنا", "Team", "عقول متنوعة، معيار واحد", "Diverse minds, one standard")] },
  { slug: "blog", kind: "system", title: t("المدونة", "Blog"), summary: t("مقالات في التقنية والتصميم والنمو.", "Articles on technology, design and growth."), sections: [H("المدونة", "Blog", "أفكار ودروس من الميدان", "Ideas and lessons from the field")] },
  { slug: "contact", kind: "system", title: t("تواصل معنا", "Contact"), summary: t("تواصل مع فريق إتقان.", "Get in touch with ALITQAN."), sections: [H("تواصل معنا", "Contact", "يسعدنا سماعك", "We'd love to hear from you", "راسلنا أو اتصل بنا وسنرد خلال يوم عمل.", "Write or call us and we'll reply within one business day.")] },
  { slug: "request", kind: "system", title: t("اطلب مشروعك", "Start a project"), summary: t("أرسل تفاصيل مشروعك أو اطلب عرض سعر.", "Send your project details or request a quote."), sections: [H("طلب مشروع", "Project request", "أخبرنا عن مشروعك", "Tell us about your project", "كلما زادت التفاصيل، كان عرضنا أدق.", "The more detail you share, the more precise our proposal.")] },
  { slug: "privacy", kind: "legal", title: t("سياسة الخصوصية", "Privacy policy"), summary: t("كيف نجمع بياناتك ونستخدمها.", "How we collect and use your data."), sections: [{ type: "rich_text", content: { title: t("سياسة الخصوصية", "Privacy policy"), body: t("## البيانات التي نجمعها\nنجمع البيانات التي ترسلها عبر نماذج التواصل وطلب المشاريع فقط (الاسم، البريد، الهاتف، تفاصيل الطلب والمرفقات).\n\n## كيف نستخدمها\nللرد على طلبك والتواصل معك بشأنه. لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة لأغراض تسويقية.\n\n## الحماية والاحتفاظ\nتُخزن البيانات في خوادم آمنة ويصل إليها الموظفون المخولون فقط، ونحتفظ بها للمدة اللازمة لخدمتك.\n\n## حقوقك\nيمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها عبر صفحة التواصل.\n\n*هذا نص نموذجي ويجب مراجعته قانونياً قبل الإطلاق.*", "## Data we collect\nOnly what you send through the contact and project request forms (name, email, phone, request details and attachments).\n\n## How we use it\nTo answer your request and contact you about it. We never sell your data or share it with third parties for marketing.\n\n## Protection and retention\nData is stored on secure servers, accessible only to authorised staff, and kept only as long as needed to serve you.\n\n## Your rights\nYou can ask to access, correct or delete your data via the contact page.\n\n*This is template text and must be reviewed by a lawyer before launch.*") } }] },
  { slug: "terms", kind: "legal", title: t("الشروط والأحكام", "Terms & conditions"), summary: t("شروط استخدام خدمات إتقان.", "Terms for using ALITQAN services."), sections: [{ type: "rich_text", content: { title: t("الشروط والأحكام", "Terms & conditions"), body: t("## القبول\nباستخدامك هذا الموقع فإنك توافق على هذه الشروط.\n\n## الخدمات\nتخضع كل خدمة لعرض واتفاقية مستقلة تحدد النطاق والتكلفة والمدة.\n\n## الملكية الفكرية\nمحتوى هذا الموقع ملك لإتقان ما لم يُذكر خلاف ذلك.\n\n*نص نموذجي — يُراجع قانونياً.*", "## Acceptance\nBy using this website you agree to these terms.\n\n## Services\nEach service is governed by a separate proposal and agreement defining scope, cost and duration.\n\n## Intellectual property\nThis website's content belongs to ALITQAN unless stated otherwise.\n\n*Template text — to be reviewed by a lawyer.*") } }] },
  { slug: "acceptable-use", kind: "legal", title: t("سياسة الاستخدام", "Acceptable use policy"), summary: t("قواعد استخدام الموقع.", "Rules for using this website."), sections: [{ type: "rich_text", content: { title: t("سياسة الاستخدام", "Acceptable use policy"), body: t("يُمنع استخدام الموقع أو نماذجه لإرسال محتوى مسيء أو رسائل مزعجة أو ملفات ضارة، أو محاولة الوصول غير المصرح به إلى أي جزء من الأنظمة.\n\n*نص نموذجي — يُراجع قانونياً.*", "You may not use this website or its forms to send abusive content, spam or malicious files, or attempt unauthorised access to any part of our systems.\n\n*Template text — to be reviewed by a lawyer.*") } }] },
];

export const navigation = {
  header: [
    { label: t("الرئيسية", "Home"), href: "/" },
    { label: t("من نحن", "About"), href: "/about", children: [{ label: t("قصتنا", "Our story"), href: "/about" }, { label: t("فريق العمل", "Team"), href: "/team" }] },
    { label: t("الخدمات", "Services"), href: "/services" },
    { label: t("أعمالنا", "Work"), href: "/projects" },
    { label: t("المدونة", "Blog"), href: "/blog" },
    { label: t("تواصل", "Contact"), href: "/contact" },
  ],
  footer: [
    { label: t("الشركة", "Company"), href: "#", children: [{ label: t("من نحن", "About"), href: "/about" }, { label: t("فريق العمل", "Team"), href: "/team" }, { label: t("المدونة", "Blog"), href: "/blog" }, { label: t("تواصل معنا", "Contact"), href: "/contact" }] },
    { label: t("الخدمات", "Services"), href: "#", children: [{ label: t("تطوير المواقع", "Websites"), href: "/services/website-development" }, { label: t("الهويات البصرية", "Branding"), href: "/services/brand-identity" }, { label: t("تجربة المستخدم", "UI/UX"), href: "/services/ui-ux-design" }, { label: t("أتمتة الأعمال", "Automation"), href: "/services/business-automation" }] },
    { label: t("ابدأ", "Start"), href: "#", children: [{ label: t("اطلب مشروعك", "Start a project"), href: "/request" }, { label: t("أعمالنا", "Our work"), href: "/projects" }] },
  ],
  footer_bottom: [
    { label: t("سياسة الخصوصية", "Privacy"), href: "/privacy" },
    { label: t("الشروط والأحكام", "Terms"), href: "/terms" },
    { label: t("سياسة الاستخدام", "Acceptable use"), href: "/acceptable-use" },
  ],
};
