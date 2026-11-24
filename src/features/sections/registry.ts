/**
 * Page-builder section registry. Each section type declares the fields the CMS
 * editor renders and the public renderer consumes. Adding a new section type =
 * add an entry here + a renderer in components/sections. No DB change needed.
 */
export type FieldKind =
  | "text"
  | "textarea"
  | "markdown"
  | "image"
  | "url"
  | "number"
  | "boolean"
  | "select"
  | "icon"
  | "tags"
  | "list";

export interface FieldDef {
  name: string;
  kind: FieldKind;
  label: { ar: string; en: string };
  localized?: boolean;
  options?: { value: string; label: { ar: string; en: string } }[];
  fields?: FieldDef[]; // for list items
  help?: { ar: string; en: string };
}

export interface SectionDef {
  type: string;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: string;
  fields: FieldDef[];
  settings?: FieldDef[];
}

const L = (ar: string, en: string) => ({ ar, en });

const eyebrow: FieldDef = { name: "eyebrow", kind: "text", localized: true, label: L("عنوان صغير", "Eyebrow") };
const title: FieldDef = { name: "title", kind: "text", localized: true, label: L("العنوان", "Title") };
const subtitle: FieldDef = { name: "subtitle", kind: "textarea", localized: true, label: L("الوصف", "Subtitle") };
const linkFields = (prefix: string, label: { ar: string; en: string }): FieldDef[] => [
  { name: `${prefix}_label`, kind: "text", localized: true, label: L(`${label.ar} — النص`, `${label.en} — label`) },
  { name: `${prefix}_href`, kind: "url", label: L(`${label.ar} — الرابط`, `${label.en} — link`) },
];
const limit: FieldDef = { name: "limit", kind: "number", label: L("عدد العناصر", "Items to show") };
const background: FieldDef = {
  name: "background",
  kind: "select",
  label: L("الخلفية", "Background"),
  options: [
    { value: "default", label: L("افتراضية", "Default") },
    { value: "muted", label: L("هادئة", "Muted") },
    { value: "brand", label: L("لون العلامة", "Brand") },
    { value: "measure", label: L("شبكة القياس", "Measure grid") },
  ],
};

export const SECTION_TYPES: SectionDef[] = [
  {
    type: "hero",
    label: L("الواجهة الرئيسية (Hero)", "Hero"),
    description: L("عنوان كبير وأزرار رئيسية", "Large headline with calls to action"),
    icon: "Sparkles",
    fields: [
      eyebrow,
      title,
      subtitle,
      ...linkFields("primary", L("الزر الأساسي", "Primary button")),
      ...linkFields("secondary", L("الزر الثانوي", "Secondary button")),
      { name: "image", kind: "image", label: L("صورة (اختياري)", "Image (optional)") },
      {
        name: "highlights",
        kind: "list",
        label: L("نقاط مختصرة", "Highlights"),
        fields: [{ name: "text", kind: "text", localized: true, label: L("النص", "Text") }],
      },
    ],
    settings: [background],
  },
  {
    type: "page_header",
    label: L("ترويسة صفحة", "Page header"),
    description: L("عنوان الصفحات الداخلية", "Inner page title band"),
    icon: "Heading",
    fields: [eyebrow, title, subtitle],
    settings: [background],
  },
  {
    type: "about",
    label: L("نبذة", "About"),
    description: L("نص تعريفي مع صورة ونقاط", "Intro text with image and highlights"),
    icon: "BookOpen",
    fields: [
      eyebrow,
      title,
      { name: "body", kind: "markdown", localized: true, label: L("المحتوى", "Body") },
      { name: "image", kind: "image", label: L("الصورة", "Image") },
      ...linkFields("link", L("رابط", "Link")),
      {
        name: "highlights",
        kind: "list",
        label: L("نقاط بارزة", "Highlights"),
        fields: [
          { name: "title", kind: "text", localized: true, label: L("العنوان", "Title") },
          { name: "text", kind: "textarea", localized: true, label: L("النص", "Text") },
        ],
      },
    ],
    settings: [background],
  },
  {
    type: "services",
    label: L("الخدمات", "Services"),
    description: L("بطاقات الخدمات من قاعدة البيانات", "Service cards from the database"),
    icon: "LayoutGrid",
    fields: [eyebrow, title, subtitle, limit, ...linkFields("link", L("رابط عرض الكل", "View-all link"))],
    settings: [
      background,
      { name: "featured_only", kind: "boolean", label: L("المميزة فقط", "Featured only") },
    ],
  },
  {
    type: "features",
    label: L("مزايا / قيم", "Features / values"),
    description: L("شبكة عناصر بأيقونات (لماذا نحن، القيم...)", "Icon grid (why us, values…)"),
    icon: "Gem",
    fields: [
      eyebrow,
      title,
      subtitle,
      {
        name: "items",
        kind: "list",
        label: L("العناصر", "Items"),
        fields: [
          { name: "icon", kind: "icon", label: L("الأيقونة", "Icon") },
          { name: "title", kind: "text", localized: true, label: L("العنوان", "Title") },
          { name: "text", kind: "textarea", localized: true, label: L("النص", "Text") },
        ],
      },
    ],
    settings: [
      background,
      {
        name: "columns",
        kind: "select",
        label: L("الأعمدة", "Columns"),
        options: [
          { value: "2", label: L("2", "2") },
          { value: "3", label: L("3", "3") },
          { value: "4", label: L("4", "4") },
        ],
      },
    ],
  },
  {
    type: "stats",
    label: L("إحصائيات", "Stats"),
    description: L("أرقام وإنجازات", "Numbers and achievements"),
    icon: "BarChart3",
    fields: [
      eyebrow,
      title,
      {
        name: "items",
        kind: "list",
        label: L("الأرقام", "Numbers"),
        fields: [
          { name: "value", kind: "text", label: L("القيمة", "Value") },
          { name: "label", kind: "text", localized: true, label: L("الوصف", "Label") },
        ],
      },
    ],
    settings: [background],
  },
  {
    type: "projects",
    label: L("مشاريع مميزة", "Featured projects"),
    description: L("أحدث أو أبرز المشاريع", "Latest or featured projects"),
    icon: "FolderKanban",
    fields: [eyebrow, title, subtitle, limit, ...linkFields("link", L("رابط عرض الكل", "View-all link"))],
    settings: [
      background,
      { name: "featured_only", kind: "boolean", label: L("المميزة فقط (لعرض الشبكة)", "Featured only (grid)") },
      {
        name: "layout",
        kind: "select",
        label: L("طريقة العرض", "Layout"),
        options: [
          { value: "grid", label: L("شبكة", "Grid") },
          { value: "slider", label: L("سلايدر (مشاريع الصفحة الرئيسية)", "Slider (homepage projects)") },
        ],
        help: L("السلايدر يعرض المشاريع المحددة في: المحتوى ← سلايدر المشاريع", "The slider shows projects chosen in Content → Projects slider"),
      },
    ],
  },
  {
    type: "process",
    label: L("آلية العمل", "Process"),
    description: L("خطوات مرقمة", "Numbered steps"),
    icon: "ListOrdered",
    fields: [
      eyebrow,
      title,
      subtitle,
      {
        name: "items",
        kind: "list",
        label: L("الخطوات", "Steps"),
        fields: [
          { name: "title", kind: "text", localized: true, label: L("العنوان", "Title") },
          { name: "text", kind: "textarea", localized: true, label: L("النص", "Text") },
        ],
      },
    ],
    settings: [background],
  },
  {
    type: "tech",
    label: L("التقنيات", "Technologies"),
    description: L("التقنيات والأدوات المستخدمة", "Tools and technologies"),
    icon: "Layers",
    fields: [eyebrow, title, subtitle, { name: "items", kind: "tags", label: L("التقنيات", "Technologies") }],
    settings: [background],
  },
  {
    type: "clients",
    label: L("العملاء والشركاء", "Clients & partners"),
    description: L("شعارات العملاء من قاعدة البيانات", "Client logos from the database"),
    icon: "Handshake",
    fields: [eyebrow, title],
    settings: [background],
  },
  {
    type: "testimonials",
    label: L("آراء العملاء", "Testimonials"),
    description: L("تقييمات من قاعدة البيانات", "Reviews from the database"),
    icon: "Quote",
    fields: [eyebrow, title, limit],
    settings: [background],
  },
  {
    type: "faq",
    label: L("الأسئلة الشائعة", "FAQ"),
    description: L("أسئلة وأجوبة قابلة للطي", "Collapsible questions"),
    icon: "HelpCircle",
    fields: [
      eyebrow,
      title,
      {
        name: "items",
        kind: "list",
        label: L("الأسئلة", "Questions"),
        fields: [
          { name: "question", kind: "text", localized: true, label: L("السؤال", "Question") },
          { name: "answer", kind: "textarea", localized: true, label: L("الإجابة", "Answer") },
        ],
      },
    ],
    settings: [background],
  },
  {
    type: "team",
    label: L("فريق العمل", "Team"),
    description: L("أعضاء الفريق من قاعدة البيانات", "Team members from the database"),
    icon: "Users",
    fields: [eyebrow, title, subtitle, limit],
    settings: [
      background,
      { name: "founders_only", kind: "boolean", label: L("المؤسسون فقط", "Founders only") },
    ],
  },
  {
    type: "posts",
    label: L("أحدث المقالات", "Latest posts"),
    description: L("مقالات المدونة", "Blog posts"),
    icon: "Newspaper",
    fields: [eyebrow, title, limit, ...linkFields("link", L("رابط المدونة", "Blog link"))],
    settings: [background],
  },
  {
    type: "rich_text",
    label: L("نص حر", "Rich text"),
    description: L("محتوى نصي منسق (Markdown)", "Formatted text (Markdown)"),
    icon: "FileText",
    fields: [title, { name: "body", kind: "markdown", localized: true, label: L("المحتوى", "Body") }],
    settings: [background],
  },
  {
    type: "image_text",
    label: L("صورة ونص", "Image + text"),
    description: L("صورة بجانب نص", "Image beside text"),
    icon: "PanelsLeftRight",
    fields: [
      eyebrow,
      title,
      { name: "body", kind: "markdown", localized: true, label: L("المحتوى", "Body") },
      { name: "image", kind: "image", label: L("الصورة", "Image") },
      ...linkFields("link", L("رابط", "Link")),
    ],
    settings: [
      background,
      {
        name: "image_side",
        kind: "select",
        label: L("موضع الصورة", "Image side"),
        options: [
          { value: "start", label: L("البداية", "Start") },
          { value: "end", label: L("النهاية", "End") },
        ],
      },
    ],
  },
  {
    type: "cta",
    label: L("دعوة لاتخاذ إجراء", "Call to action"),
    description: L("شريط دعوة بارز", "Prominent call-to-action band"),
    icon: "Megaphone",
    fields: [
      title,
      subtitle,
      ...linkFields("primary", L("الزر الأساسي", "Primary button")),
      ...linkFields("secondary", L("الزر الثانوي", "Secondary button")),
    ],
    settings: [background],
  },
  {
    type: "contact_info",
    label: L("بيانات التواصل", "Contact details"),
    description: L("من إعدادات الموقع", "From site settings"),
    icon: "Phone",
    fields: [eyebrow, title, subtitle],
    settings: [background],
  },
];

export const SECTION_MAP: Record<string, SectionDef> = Object.fromEntries(SECTION_TYPES.map((s) => [s.type, s]));

/** Curated icon set (Lucide names) used in features/services; keeps the icon style consistent. */
export const ICON_CHOICES = [
  "Code2", "AppWindow", "ServerCog", "ShoppingBag", "Workflow", "Plug", "PenTool", "Palette", "Shapes",
  "MousePointerClick", "Megaphone", "Search", "LineChart", "Target", "Compass", "Rocket",
  "ShieldCheck", "Gauge", "Layers", "Sparkles", "Gem", "Handshake", "Clock", "Users", "MessageSquare",
  "Globe", "Smartphone", "Database", "Bot", "Repeat", "BadgeCheck", "Ruler", "Award", "HeartHandshake",
  "Eye", "Zap", "Boxes", "ClipboardCheck", "Map",
] as const;
