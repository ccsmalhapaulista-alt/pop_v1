export function EmptyState({ title, description, action }) {
  return (
    <div className="state-card">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
