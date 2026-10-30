import React from 'react';
import { Icon } from './SvgIcons.jsx';

export function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      <Icon name="check" className="i-16" />
      <span>{message}</span>
    </div>
  );
}
