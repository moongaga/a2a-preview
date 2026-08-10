import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';
import { m10Glossary, type M10TermKey } from './m10-glossary';

export interface M10TermHelpProps {
  term: M10TermKey;
  label?: string;
}

type Position = { left: number; top?: number; bottom?: number };

export function M10TermHelp({ term, label }: M10TermHelpProps) {
  const entry = m10Glossary[term];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<Position>({ left: 12, top: 12 });

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(300, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    const roomBelow = window.innerHeight - rect.bottom;
    setPosition(roomBelow >= 150
      ? { left, top: rect.bottom + 8 }
      : { left, bottom: window.innerHeight - rect.top + 8 });
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setPinned(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    const onViewportChange = () => updatePosition();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open]);

  const togglePinned = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (open && pinned) {
      close();
      return;
    }
    updatePosition();
    setPinned(true);
    setOpen(true);
  };

  return <>
    <button
      ref={buttonRef}
      type="button"
      className="m10-term-help"
      aria-label={`解释：${label || entry.name}`}
      aria-expanded={open}
      aria-describedby={open ? descriptionId : undefined}
      onClick={togglePinned}
      onMouseEnter={show}
      onMouseLeave={() => { if (!pinned) setOpen(false); }}
      onFocus={show}
      onBlur={() => { if (!pinned) setOpen(false); }}
    >
      <CircleHelp size={13} aria-hidden="true" />
    </button>
    {open && createPortal(
      <aside id={descriptionId} className="m10-term-popover" role="tooltip" style={position}>
        <strong>{entry.name}</strong>
        {entry.fullName && <span>{entry.fullName}</span>}
        <p>{entry.description}</p>
      </aside>,
      document.body,
    )}
  </>;
}
