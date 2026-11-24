# الإعداد والتشغيل · Setup

## 1. المتطلبات
- Node.js 20.9 أو أحدث (تم الاختبار على Node 24).
- حساب Supabase (مجاني يكفي للبداية).

## 2. إنشاء مشروع Supabase
1. من https://supabase.com/dashboard أنشئ مشروعاً جديداً (اختر منطقة قريبة، مثل Frankfurt أو Bahrain إن توفرت).
2. **Project Settings → API**: انسخ
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / publishable key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role / secret key` → `SUPABASE_SERVICE_ROLE_KEY` (سري — للخادم فقط)
3. **Project Settings → Database → Connection string → Session pooler (port 5432)** → `DATABASE_URL` (استبدل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات).
4. **Authentication → Sign In / Providers → Email**:
   - أبقِ Email مفعّلاً.
   - **عطّل "Allow new users to sign up"** (المستخدمون يُضافون من لوحة التحكم فقط). حتى لو بقي مفعّلاً، أي حساب جديد يُنشأ *معطلاً وبدون صلاحيات*.
5. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` محلياً، ثم رابط الإنتاج.
   - Redirect URLs: أضف `http://localhost:3000/auth/callback` و `https://YOUR-DOMAIN/auth/callback`.
6. (اختياري لكن مُستحسن) **Authentication → Emails → SMTP**: اضبط مزود بريد حتى تعمل رسائل استعادة كلمة المرور والدعوات بشكل موثوق (المزود الافتراضي لـ Supabase محدود جداً).

## 3. البيئة المحلية
```bash
npm install
cp .env.example .env.local
```
عبّئ `.env.local`، ثم ولّد رمز الإعداد:
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```
ضعه في `SETUP_TOKEN`، وضع قيمة عشوائية طويلة أخرى في `IP_HASH_SALT`.

## 4. قاعدة البيانات
```bash
npm run db:migrate   # الجداول، الدوال، RLS، حاويات التخزين
npm run db:seed      # بيانات تجريبية واقعية (قابلة للحذف بالكامل)
```
يمكن بدلاً من ذلك لصق ملفات `database/migrations/*.sql` بالترتيب ثم `database/seed/seed.sql` في **SQL Editor** في Supabase.

## 5. إنشاء حساب المالك (Super Admin)
لا توجد أي حسابات أو كلمات مرور افتراضية في المشروع. طريقتان:

**أ) من المتصفح:** شغّل `npm run dev` وافتح `http://localhost:3000/admin/setup`، أدخل `SETUP_TOKEN` والاسم والبريد وكلمة مرور (12 حرفاً على الأقل).
تختفي الصفحة (404) تلقائياً بعد إنشاء المالك. **احذف `SETUP_TOKEN` من متغيرات البيئة بعدها.**

**ب) من الطرفية:**
```bash
npm run create-owner -- --email you@company.com --name "Your Name"
```
(تُكتب كلمة المرور بشكل مخفي ولا تُحفظ.)

الحماية مزدوجة: الكود يتحقق من الرمز، ودالة SQL `bootstrap_owner` ترفض العملية إن وُجد مالك نشط.

## 6. التشغيل
```bash
npm run dev     # تطوير: http://localhost:3000 → /ar
npm run check   # فحص الأنواع + الاختبارات + بناء الإنتاج
npm run build && npm start
```
- الموقع: `/ar` و `/en`
- لوحة التحكم: `/admin`

## 7. خدمات اختيارية
| الخدمة | المتغيرات | الأثر |
|---|---|---|
| Resend (إشعارات البريد) | `RESEND_API_KEY`, `EMAIL_FROM` | إشعار للإدارة عند كل طلب/رسالة. بدونها تُحفظ الطلبات في اللوحة ويظهر بجانبها "البريد غير مضبوط". |
| Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | تحقق ضد الروبوتات في النماذج (إضافة لحماية الوقت/الفخ/حد المعدل الموجودة دائماً). |
| Google Analytics 4 | من الإعدادات → التحليلات | يُحمّل في الموقع العام فقط عند إدخال المعرف. |

### إعداد Resend
1. أنشئ حساباً في resend.com وتحقق من نطاقك (DNS).
2. أنشئ API key وضعه في `RESEND_API_KEY`.
3. `EMAIL_FROM="ALITQAN <notifications@your-domain.com>"`.
4. من اللوحة: الإعدادات → الإشعارات → أضف عناوين المستلمين.
5. أرسل طلباً تجريبياً من `/ar/request` وتحقق أن حالة الإشعار في تفاصيل الطلب = "أُرسل إشعار بريدي".
