type ComingSoonProps = {
  title: string;
};

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <main className="coming-soon dotted">
      <div>
        <h1>{title}</h1>
        <p>Coming soon.</p>
      </div>
    </main>
  );
}
