import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { LazyMotion, domMax, MotionConfig } from "framer-motion";
import { Home } from "./routes/Home";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { Spinner } from "./lib/ui";

// Code-splitting : seul l'accueil est chargé d'emblée ; les écrans qui tirent
// Firebase (host/join/play/historique) sont en chunks séparés, chargés à la demande.
const Create = lazy(() =>
  import("./routes/Create").then((m) => ({ default: m.Create })),
);
const QuizEditor = lazy(() =>
  import("./routes/QuizEditor").then((m) => ({ default: m.QuizEditor })),
);
const AiGenerate = lazy(() =>
  import("./routes/AiGenerate").then((m) => ({ default: m.AiGenerate })),
);
const Host = lazy(() =>
  import("./routes/Host").then((m) => ({ default: m.Host })),
);
const Join = lazy(() =>
  import("./routes/Join").then((m) => ({ default: m.Join })),
);
const Play = lazy(() =>
  import("./routes/Play").then((m) => ({ default: m.Play })),
);
const Solo = lazy(() =>
  import("./routes/Solo").then((m) => ({ default: m.Solo })),
);
const History = lazy(() =>
  import("./routes/History").then((m) => ({ default: m.History })),
);

export function App() {
  return (
    // LazyMotion strict : seuls les composants `m.*` sont autorisés (bundle réduit) ;
    // domMax requis pour les animations `layout` du Leaderboard.
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <Suspense
            fallback={
              <div className="flex min-h-dvh items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/create/ai" element={<AiGenerate />} />
              <Route path="/create/new" element={<QuizEditor />} />
              <Route path="/create/:quizId" element={<QuizEditor />} />
              <Route path="/host/:sessionId" element={<Host />} />
              <Route path="/join" element={<Join />} />
              <Route path="/play/:sessionId" element={<Play />} />
              <Route path="/solo" element={<Solo />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <UpdatePrompt />
        </HashRouter>
      </MotionConfig>
    </LazyMotion>
  );
}
