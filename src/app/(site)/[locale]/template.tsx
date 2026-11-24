import { ViewTransition } from "react";

/**
 * Page transitions. A template re-mounts on every navigation, so React's
 * <ViewTransition> runs the exit animation on the old page and the enter
 * animation on the new one through the browser View Transitions API — no
 * extra JavaScript, no white flash, links stay instant. The header is anchored
 * (view-transition-name: site-header). CSS: motion.css (.page); disabled by the
 * CMS setting or prefers-reduced-motion. Unsupported browsers simply navigate.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
