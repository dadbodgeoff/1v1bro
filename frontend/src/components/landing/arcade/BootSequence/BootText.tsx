/**
 * BootText - Typewriter text display for boot sequence
 * 
 * Displays boot lines with typewriter effect and blinking cursor.
 * 
 * @module landing/arcade/BootSequence/BootText
 * Requirements: 2.2, 2.3
 */

import { cn } from '@/utils/helpers';
import { DELIGHT_DETAILS } from '../constants';
import type { BootTextProps } from '../types';
import '../styles/arcade.css';

export function BootText({ lines, currentLine, isTyping = false }: BootTextProps) {
  return (
    <div className="boot-text-container" role="status" aria-live="polite">
      {lines.slice(0, currentLine + 1).map((line, index) => (
        <div
          key={index}
          className={cn('boot-line')}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {line}
          {/* Show cursor on current line while typing */}
          {index === currentLine && isTyping && (
            <span className="boot-cursor" aria-hidden="true">
              {DELIGHT_DETAILS.terminalCursor.character}
            </span>
          )}
        </div>
      ))}
      
      {/* Show cursor at end when not typing but still booting */}
      {!isTyping && currentLine < lines.length && (
        <span className="boot-cursor" aria-hidden="true">
          {DELIGHT_DETAILS.terminalCursor.character}
        </span>
      )}
    </div>
  );
}

export default BootText;
