import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LatelyPage } from "./pages/LatelyPage";
import { CategoryPage } from "./pages/CategoryPage";
import { PostPage } from "./pages/PostPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="lately" element={<LatelyPage />} />
          <Route path="games" element={<CategoryPage category="games" />} />
          <Route path="games/:slug" element={<PostPage category="games" />} />
          <Route path="books" element={<CategoryPage category="books" />} />
          <Route path="books/:slug" element={<PostPage category="books" />} />
          <Route path="other" element={<CategoryPage category="other" />} />
          <Route path="other/:slug" element={<PostPage category="other" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
