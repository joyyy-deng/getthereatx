import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import { AB_TESTS, type AbTest } from './lib/abTests';
import { Community } from './pages/Community';
import { ComponentGallery } from './pages/ComponentGallery';
import { EventRoute } from './pages/EventDetail';
import { GuideRoute } from './pages/Guide';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { PlanTrip } from './pages/PlanTrip';
import { SiteMap } from './pages/SiteMap';
import { StartAbTest } from './pages/StartAbTest';
import { Resources } from './pages/Resources';
import { StudentResources } from './pages/StudentResources';
import { TemplatePreview } from './pages/TemplatePreview';

const router = createBrowserRouter(
  [
    {
      element: <SiteLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/plan', element: <PlanTrip /> },
        { path: '/community', element: <Community /> },
        { path: '/community/events/:slug', element: <EventRoute /> },
        { path: '/resources', element: <Resources /> },
        { path: '/resources/students', element: <StudentResources /> },
        { path: '/guides/:slug', element: <GuideRoute /> },
        { path: '/dev/components', element: <ComponentGallery /> },
        { path: '/dev/sitemap', element: <SiteMap /> },
        { path: '/dev/templates/:kind', element: <TemplatePreview /> },
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
