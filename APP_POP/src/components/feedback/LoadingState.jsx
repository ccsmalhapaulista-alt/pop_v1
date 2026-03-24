export function LoadingState({ message = 'Carregando...', fullScreen = false }) {
  return (
    <div className={`state-card ${fullScreen ? 'full-screen' : ''}`}>
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
