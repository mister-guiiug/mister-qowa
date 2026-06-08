import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./routes/Home";
import { Create } from "./routes/Create";
import { QuizEditor } from "./routes/QuizEditor";
import { Host } from "./routes/Host";
import { Join } from "./routes/Join";
import { Play } from "./routes/Play";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/create/new" element={<QuizEditor />} />
        <Route path="/create/:quizId" element={<QuizEditor />} />
        <Route path="/host/:sessionId" element={<Host />} />
        <Route path="/join" element={<Join />} />
        <Route path="/play/:sessionId" element={<Play />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
