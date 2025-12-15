import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
