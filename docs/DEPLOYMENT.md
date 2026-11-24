# النشر على Vercel · Deployment

## الخطوات
1. ارفع المشروع إلى مستودع Git خاص (GitHub/GitLab).
2. في Vercel: **Add New → Project** واختر المستودع (Framework: Next.js — يُكتشف تلقائياً).
3. **Environment Variables** (Production + Preview):
   | Variable | ملاحظة |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
   | `SUPABASE_SERVICE_ROLE_KEY` | سري — لا تضعه أبداً بمتغير يبدأ بـ `NEXT_PUBLIC_` |
   | `NEXT_PUBLIC_SITE_URL` | `https://alitqan.com` (بدون / في النهاية) |
   | `IP_HASH_SALT` | قيمة عشوائية طويلة |
   | `SETUP_TOKEN` | فقط حتى إنشاء المالك، ثم احذفه وأعد النشر |
   | `RESEND_API_KEY`, `EMAIL_FROM` | اختياري |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | اختياري |
   `DATABASE_URL` غير مطلوب في Vercel (يُستخدم محلياً لتطبيق migrations فقط).
4. Deploy.
5. **Domains**: أضف `alitqan.com` و `www.alitqan.com` واتبع تعليمات DNS.
6. في Supabase → Authentication → URL Configuration: Site URL = رابط الإنتاج، وأضف `https://alitqan.com/auth/callback` إلى Redirect URLs.
7. من اللوحة: الإعدادات → عام → رابط الموقع الأساسي.
8. Google Search Console: أضف الموقع، وضع رمز التحقق في الإعدادات → SEO، وأرسل `https://alitqan.com/sitemap.xml`.

## قائمة فحص الإنتاج
- [ ] `npm run check` ينجح محلياً.
- [ ] تسجيل المستخدمين العام معطل في Supabase Auth.
- [ ] تم إنشاء المالك، وحُذف `SETUP_TOKEN` (يجب أن تعيد `/admin/setup` صفحة 404).
- [ ] SMTP مضبوط في Supabase (لرسائل الاستعادة والدعوات).
- [ ] Resend مضبوط واختُبر بطلب حقيقي (اختياري).
- [ ] حُذف المحتوى التجريبي أو استُبدل (الإعدادات → المحتوى التجريبي)، ورُوجعت الصفحات القانونية من مختص.
- [ ] نسخ احتياطي: Supabase → Database → Backups (الخطة المدفوعة تتيح PITR).

## الأداء والتخزين المؤقت
- الصفحات العامة تُولّد عند أول زيارة ثم تُخزّن (ISR)؛ كل حفظ في لوحة التحكم يستدعي `revalidatePath` فتظهر التغييرات فوراً.
- صور Supabase Storage تمر عبر `next/image` (AVIF/WebP، أحجام متجاوبة، lazy loading).
- رؤوس الأمان (HSTS, nosniff, frame-options, referrer-policy, permissions-policy) مضبوطة في `next.config.ts`، ولوحة التحكم `noindex` و `no-store`.
