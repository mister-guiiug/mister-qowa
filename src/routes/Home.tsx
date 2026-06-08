import { useNavigate } from "react-router-dom";
import { Zap, Users } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { AppFooter } from "../components/AppFooter";

export function Home() {
  const nav = useNavigate();
  return (
    <Screen className="justify-center text-center">
      <h1 className="font-display text-5xl text-brand-soft">Mister Qowa</h1>
      <p className="mt-3 text-balance text-white/70">
        Quiz interactifs en temps réel. Réponds vite, grimpe au classement.
      </p>
      <div className="mt-10 flex flex-col gap-3">
        <Button full onClick={() => nav("/create")}>
          <Zap className="size-5" /> Héberger un quiz
        </Button>
        <Button full variant="ghost" onClick={() => nav("/join")}>
          <Users className="size-5" /> Rejoindre une partie
        </Button>
      </div>
      <AppFooter />
    </Screen>
  );
}
