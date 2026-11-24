/**
 * Runs before paint: applies the visitor's saved theme (light/dark/system) or the
 * brand default, so there is no flash. The preference is a per-visitor
 * convenience kept in localStorage; no site data is stored in the browser.
 */
export function ThemeScript({ defaultTheme }: { defaultTheme: string }) {
  const code = `(function(){try{var d=document.documentElement;d.classList.add('js');var p=localStorage.getItem('theme')||${JSON.stringify(
    defaultTheme,
  )};var m=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;d.setAttribute('data-theme',m==='dark'?'dark':'light');d.setAttribute('data-theme-pref',p);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
