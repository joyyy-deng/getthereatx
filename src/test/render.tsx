import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

/** Render inside a router, as the site does (PageLink needs one). */
export function renderPage(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}
