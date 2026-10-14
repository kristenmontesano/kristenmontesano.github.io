import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ComingSoon } from "./components/ComingSoon";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LatelyPage } from "./pages/LatelyPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="lately" element={<LatelyPage />} />
          <Route path="games" element={<ComingSoon title="Games" />} />
          <Route path="books" element={<ComingSoon title="Books" />} />
          <Route path="other" element={<ComingSoon title="Other" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
