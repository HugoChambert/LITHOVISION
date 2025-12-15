import { useState, useEffect } from 'react';
import './KeyboardShortcuts.css';

function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsVisible(v => !v);
      } else if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        className="shortcuts-trigger"
        onClick={() => setIsVisible(true)}
        title="Keyboard Shortcuts (?)"
        aria-label="Show keyboard shortcuts"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 12H7v-2h3v2zm0-4H7V9h3v2zm0-4H7V5h3v2zm4 8h-3v-2h3v2zm0-4h-3V9h3v2zm0-4h-3V5h3v2zm4 8h-3v-2h3v2zm0-4h-3V9h3v2zm0-4h-3V5h3v2z"/>
        </svg>
        ?
      </button>
    );
  }

  const shortcuts = [
    { keys: ['Ctrl', 'Shift', 'A'], description: 'Access admin panel' },
    { keys: ['?'], description: 'Show/hide this help' },
    { keys: ['Esc'], description: 'Close modal or zoom' },
    { keys: ['+'], description: 'Zoom in (when viewing image)' },
    { keys: ['-'], description: 'Zoom out (when viewing image)' },
    { keys: ['0'], description: 'Reset zoom (when viewing image)' },
  ];

  return (
    <div className="shortcuts-modal-overlay" onClick={() => setIsVisible(false)}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h3>Keyboard Shortcuts</h3>
          <button
            className="close-shortcuts"
            onClick={() => setIsVisible(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="shortcut-item">
              <div className="shortcut-keys">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="shortcut-key">{key}</kbd>
                    {i < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
                  </span>
                ))}
              </div>
              <span className="shortcut-description">{shortcut.description}</span>
            </div>
          ))}
        </div>
        <div className="shortcuts-footer">
          Press <kbd className="shortcut-key">?</kbd> to toggle this help anytime
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcuts;
