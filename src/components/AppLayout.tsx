import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="h-screen w-screen bg-mist flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden contour-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
