import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route
        path="*"
        element={
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">404</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Page not found</p>
              <a href="/" className="text-blue-500 hover:underline">
                Go home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
