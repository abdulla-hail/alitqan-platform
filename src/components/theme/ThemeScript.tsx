/**
 * Runs before paint: applies the visitor's saved theme, so there is no flash.
 * Only two modes exist — light and dark. The device setting is never consulted;
 * first-time visitors get the brand default (light unless an admin chose dark).
 * The choice is a per-visitor convenience kept in localStorage ("theme").
 */
export function ThemeScript({ defaultTheme }: { defaultTheme?: string }) {
  const fallback = defaultTheme === "dark" ? "dark" : "light";
  const code = `(function(){try{var d=document.documentElement;d.classList.add('js');var p=null;try{p=localStorage.getItem('theme')}catch(e){}if(p!=='light'&&p!=='dark')p=${JSON.stringify(
    fallback,
  )};d.setAttribute('data-theme',p);d.style.colorScheme=p;}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
