export function ScientistGuide({ children }: { children: React.ReactNode }) {
  return (
    <aside className="scientist-guide">
      <img src="/kongkong-doctor.png" alt="콩콩 박사" />
      <div className="guide-bubble">{children}</div>
    </aside>
  );
}
