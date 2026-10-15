import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import { Community } from './pages/Community';
import { ComponentGallery } from './pages/ComponentGallery';
import { Home } from './pages/Home';
import { Placeholder } from './pages/Placeholder';
import { PlanTrip } from './pages/PlanTrip';
import { Resources } from './pages/Resources';
import { StudentResources } from './pages/StudentResources';

const router = createBrowserRouter(
  [
    {
      element: <SiteLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/plan', element: <PlanTrip /> },
        { path: '/community', element: <Community /> },
        { path: '/resources', element: <Resources /> },
        { path: '/resources/students', element: <StudentResources /> },
        { path: '/dev/components', element: <ComponentGallery /> },
        { path: '*', element: <Placeholder title="Page not found" phase={1} /> },
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
