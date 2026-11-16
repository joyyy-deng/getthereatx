import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLoading } from './components/ui/PageLoading';
import { SiteLayout } from './components/layout/SiteLayout';
import { AB_TESTS, type AbTest } from './lib/abTests';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { StartAbTest } from './pages/StartAbTest';

// Every page but Home loads when it is first opened, so the map library (Leaflet)
// and the dev pages are not downloaded by visitors who never open them.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => {
  const Page = lazy<ComponentType>(() => load().then((m) => ({ default: m[name] })));
  return (
    <Suspense fallback={<PageLoading />}>
      <Page />
    </Suspense>
  );
};

const router = createBrowserRouter(
  [
    {
      element: <SiteLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/plan', element: page(() => import('./pages/PlanTrip'), 'PlanTrip') },
        { path: '/community', element: page(() => import('./pages/Community'), 'Community') },
        { path: '/community/events/:slug', element: page(() => import('./pages/EventDetail'), 'EventRoute') },
        { path: '/resources', element: page(() => import('./pages/Resources'), 'Resources') },
        { path: '/resources/students', element: page(() => import('./pages/StudentResources'), 'StudentResources') },
        { path: '/guides/:slug', element: page(() => import('./pages/Guide'), 'GuideRoute') },
        { path: '/dev/components', element: page(() => import('./pages/ComponentGallery'), 'ComponentGallery') },
        { path: '/dev/sitemap', element: page(() => import('./pages/SiteMap'), 'SiteMap') },
        { path: '/dev/templates/:kind', element: page(() => import('./pages/TemplatePreview'), 'TemplatePreview') },
        // A/B test links: /go=a, /go=b, /learn=a, /learn=b (see lib/abTests.ts).
        ...(Object.keys(AB_TESTS) as AbTest[]).flatMap((test) =>
          AB_TESTS[test].versions.map((version) => ({
            path: `/${test}=${version}`,
            element: <StartAbTest test={test} version={version} />,
          })),
        ),
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    // "/" locally, "/getthereatx" on GitHub Pages.
    basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
  },
);

export default function App() {
  return <RouterProvider router={router} />;
}
