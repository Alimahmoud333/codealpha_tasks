export default function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <h2 className="empty-state__title">{title}</h2>
      {children && <p className="empty-state__text">{children}</p>}
      {action}
    </div>
  );
}
