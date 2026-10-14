import { GamesCanvas } from "../components/GamesCanvas";

export function LatelyPage() {
  return (
    <main className="lately">
      <h1 className="sr-only">Lately</h1>
      <p className="sr-only">What I've been playing lately.</p>
      <GamesCanvas />
    </main>
  );
}
