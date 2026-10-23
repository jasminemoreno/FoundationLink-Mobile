// Maps the web app's link paths (from the server's notifications and pushes)
// to the closest equivalent mobile route.
// Highlight-scrolling (?highlight=123) isn't supported on mobile yet.
export function resolveMobileRoute(link?: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/donor/campaigns")) return "/campaigns";
  if (link.startsWith("/donor/donations")) return "/my-donations";
  // campaign updates open the foundation's page, like on the web
  const foundation = link.match(/^\/donor\/foundations\/(\d+)/);
  if (foundation) return `/foundation/${foundation[1]}`;
  return null;
}
