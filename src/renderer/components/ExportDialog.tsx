import { useEffect, useState } from 'react';

import type {
  ExportBackground,
  ExportFormat,
  ExportQuality,
} from '@shared/electron-api';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: {
    background: ExportBackground;
    format: ExportFormat;
    quality: ExportQuality;
  }) => void;
}

export function ExportDialog({ open, onClose, onConfirm }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('medium');
  const [background, setBackground] = useState<ExportBackground>('paper');

  useEffect(() => {
    if (format === 'jpg') {
      setBackground('paper');
    }
  }, [format]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Export diagram"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <div>
            <h2>Export image</h2>
            <p>Choose a format and resolution preset.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="dialog__grid">
          <fieldset className="dialog__fieldset">
            <legend>Format</legend>
            <label>
              <input
                checked={format === 'png'}
                name="format"
                type="radio"
                onChange={() => setFormat('png')}
              />
              PNG
            </label>
            <label>
              <input
                checked={format === 'jpg'}
                name="format"
                type="radio"
                onChange={() => setFormat('jpg')}
              />
              JPG
            </label>
          </fieldset>

          <fieldset className="dialog__fieldset">
            <legend>Quality</legend>
            <label>
              <input
                checked={quality === 'low'}
                name="quality"
                type="radio"
                onChange={() => setQuality('low')}
              />
              Low
            </label>
            <label>
              <input
                checked={quality === 'medium'}
                name="quality"
                type="radio"
                onChange={() => setQuality('medium')}
              />
              Medium
            </label>
            <label>
              <input
                checked={quality === 'high'}
                name="quality"
                type="radio"
                onChange={() => setQuality('high')}
              />
              High
            </label>
          </fieldset>

          <fieldset className="dialog__fieldset">
            <legend>Background</legend>
            <label>
              <input
                checked={background === 'paper'}
                name="background"
                type="radio"
                onChange={() => setBackground('paper')}
              />
              Light paper
            </label>
            <label>
              <input
                checked={background === 'transparent'}
                name="background"
                type="radio"
                onChange={() => setBackground('transparent')}
                disabled={format === 'jpg'}
              />
              Transparent
            </label>
          </fieldset>
        </div>

        <div className="dialog__footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="accent-button"
            onClick={() => onConfirm({ background, format, quality })}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
