import { GamesCanvas } from "../components/GamesCanvas";

export function LatelyPage() {
  return (
    <main className="lately">
      <h1 className="sr-only">Lately</h1>
      <p className="sr-only">Games and books I've engaged with lately.</p>
      <GamesCanvas />
    </main>
  );
}
