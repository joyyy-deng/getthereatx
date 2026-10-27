import { Navigate } from 'react-router-dom';
import { AB_TESTS, startAbTest, type AbTest, type AbVersion } from '../lib/abTests';

/** /go=b and friends: start that test in this tab, then open the page being tested. */
export function StartAbTest({ test, version }: { test: AbTest; version: AbVersion }) {
  startAbTest(test, version);
  return <Navigate to={AB_TESTS[test].page} replace />;
}
