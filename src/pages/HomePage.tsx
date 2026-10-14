import { WebGLCanvas } from "../components/WebGLCanvas";

export function HomePage() {
  return (
    <main className="home">
      <WebGLCanvas />
      <section className="sr-only" aria-labelledby="about-heading">
        <h1 id="about-heading">Hi, I'm Kristen</h1>
        <p>Welcome to my musings on games, books, and other things.</p>
      </section>
    </main>
  );
}
