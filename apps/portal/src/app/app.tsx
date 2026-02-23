import { Button } from '@/components/ui/button';
import { Route, Routes, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleSidebar } from '../store/uiSlice';

export function App() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen);

  return (
    <div>
      <div className="flex items-center gap-4 p-4">
        <Button variant="link" className="bg-red-500 text-white">Primary button</Button>
        <Button variant="outline">Outline button</Button>
      </div>

      <div className="p-4 space-y-2">
        <div>Sidebar is {sidebarOpen ? 'open' : 'closed'}</div>
        <Button variant="outline" onClick={() => dispatch(toggleSidebar())}>
          Toggle sidebar
        </Button>
      </div>

      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              This is the generated root route.{' '}
              <Link to="/page-2">Click here for page 2.</Link>
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>
            </div>
          }
        />
      </Routes>
      {/* END: routes */}
    </div>
  );
}

export default App;
