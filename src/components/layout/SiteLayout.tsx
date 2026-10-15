import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Nav } from './Nav';

export function SiteLayout() {
  // Plan Your Trip fills the screen, so it has no footer.
  const fullScreen = useLocation().pathname === '/plan';
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:bg-bg focus:p-2"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {!fullScreen && <Footer />}
      <ScrollRestoration />
    </div>
  );
}
