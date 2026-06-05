interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts: Array<{ keys: string; action: string }> = [
  { keys: 'Cmd / Ctrl + Enter', action: '立即渲染当前代码' },
  { keys: '编辑 / 粘贴', action: '自动防抖渲染（实时预览）' },
  { keys: '滚轮', action: '以光标为中心缩放预览' },
  { keys: '按住拖拽', action: '平移预览画布' },
  { keys: 'Fit 按钮', action: '自动适配窗口并跟随缩放' },
  { keys: '拖动中缝 / 方向键', action: '调整左右分栏比例' },
  { keys: 'Esc', action: '关闭弹窗' },
];

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label="键盘快捷键">
        <div className="dialog__header">
          <div>
            <h2>键盘与交互</h2>
            <p>更高效地使用 Mermaid Flow Studio。</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <ul className="shortcuts__list">
          {shortcuts.map((item) => (
            <li key={item.keys} className="shortcuts__row">
              <kbd className="shortcuts__keys">{item.keys}</kbd>
              <span>{item.action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
