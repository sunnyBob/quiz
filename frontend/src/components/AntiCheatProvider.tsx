import React, { useEffect, useCallback } from 'react';

interface AntiCheatProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  watermarkText?: string;
  onViolation?: (type: string, details: string) => void;
}

const AntiCheatProvider: React.FC<AntiCheatProviderProps> = ({
  children,
  enabled = true,
  watermarkText = 'Exam in Progress',
  onViolation
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Block common shortcuts
    const blockedKeys = [
      // Copy/Paste
      { ctrl: true, key: 'c' },
      { ctrl: true, key: 'v' },
      { ctrl: true, key: 'a' },
      { ctrl: true, key: 's' },
      { ctrl: true, key: 'x' },
      // Developer tools
      { key: 'F12' },
      { ctrl: true, shift: true, key: 'I' },
      { ctrl: true, shift: true, key: 'C' },
      { ctrl: true, shift: true, key: 'J' },
      // View source
      { ctrl: true, key: 'u' },
      // Print
      { ctrl: true, key: 'p' },
      // Find
      { ctrl: true, key: 'f' },
      // Refresh (can be problematic for quiz state)
      { key: 'F5' },
      { ctrl: true, key: 'r' }
    ];

    const isBlocked = blockedKeys.some(blocked => {
      const ctrlMatch = blocked.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = blocked.shift ? e.shiftKey : !e.shiftKey;
      const keyMatch = blocked.key.toLowerCase() === e.key.toLowerCase();
      return ctrlMatch && shiftMatch && keyMatch;
    });

    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      onViolation?.('keyboard_shortcut', `Blocked shortcut: ${e.key}`);
      return false;
    }
  }, [enabled, onViolation]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    onViolation?.('right_click', 'Right-click context menu blocked');
  }, [enabled, onViolation]);

  const handleSelectStart = useCallback((e: Event) => {
    if (!enabled) return;
    e.preventDefault();
    onViolation?.('text_selection', 'Text selection blocked');
  }, [enabled, onViolation]);

  const handleDragStart = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    onViolation?.('drag_drop', 'Drag and drop blocked');
  }, [enabled, onViolation]);

  const handlePrint = useCallback((e: Event) => {
    if (!enabled) return;
    e.preventDefault();
    onViolation?.('print_attempt', 'Print attempt blocked');
  }, [enabled, onViolation]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('beforeprint', handlePrint, true);

    // Disable image dragging
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = false;
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('beforeprint', handlePrint, true);
    };
  }, [enabled, handleKeyDown, handleContextMenu, handleSelectStart, handleDragStart, handlePrint]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="anti-cheat">
      {/* Watermark */}
      <div className="watermark">
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
          <div className="transform -rotate-45 text-4xl font-bold text-gray-400 whitespace-nowrap select-none">
            {watermarkText}
          </div>
        </div>
      </div>

      {/* Print warning */}
      <div className="print-warning">
        <h2>⚠️ 打印被禁止</h2>
        <p>此考试内容不允许打印</p>
      </div>

      {/* Main content */}
      <div className="no-print">
        {children}
      </div>
    </div>
  );
};

export default AntiCheatProvider;