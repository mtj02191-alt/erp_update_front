import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import './EmailBodyEditor.css';

const looksLikeHtml = (value) => /<[a-z][\s\S]*>/i.test(String(value || ''));

const plainTextToHtml = (value) => {
  const text = String(value || '');
  if (!text.trim()) return '<p><br></p>';
  if (looksLikeHtml(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
};

/**
 * Simple formatting toolbar for non-technical template creators.
 * Saves HTML into the template body.
 */
const EmailBodyEditor = forwardRef(({
  label = 'Message Content',
  value = '',
  onChange,
  required = false,
}, ref) => {
  const fieldRef = useRef(null);
  const savedRangeRef = useRef(null);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const next = plainTextToHtml(value);
    if (el.innerHTML !== next && document.activeElement !== el) {
      el.innerHTML = next || '<p><br></p>';
    }
  }, [value]);

  const emitChange = () => {
    const el = fieldRef.current;
    if (!el || typeof onChange !== 'function') return;
    onChange(el.innerHTML);
  };

  const saveSelection = () => {
    const el = fieldRef.current;
    const selection = window.getSelection();
    if (!el || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const el = fieldRef.current;
    const range = savedRangeRef.current;
    if (!el || !range) return false;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const run = (command, arg = null) => {
    restoreSelection();
    fieldRef.current?.focus();
    document.execCommand(command, false, arg);
    saveSelection();
    emitChange();
  };

  const applyHeading = (tag) => {
    restoreSelection();
    fieldRef.current?.focus();
    const block = tag.replace(/[<>]/g, '');
    document.execCommand('formatBlock', false, `<${block}>`);
    saveSelection();
    emitChange();
  };

  const applyLink = () => {
    const url = window.prompt('Paste the link (must start with https://)', 'https://');
    if (!url || !url.trim()) return;
    const href = url.trim();
    if (!/^https?:\/\//i.test(href)) {
      window.alert('Link must start with http:// or https:// so clicks can be tracked.');
      return;
    }
    run('createLink', href);
  };

  const insertToken = (token) => {
    const el = fieldRef.current;
    if (!el) return;
    const restored = restoreSelection();
    const selection = window.getSelection();
    if (restored && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(token);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      savedRangeRef.current = range.cloneRange();
    } else {
      el.focus();
      el.innerHTML = `${el.innerHTML || ''}${token}`;
    }
    emitChange();
  };

  useImperativeHandle(ref, () => ({ insertToken }));

  return (
    <div className="email-body-editor">
      <label className="email-body-editor__label">
        {label}
        {required ? ' *' : ''}
      </label>
      <p className="email-body-editor__hint">
        Use the buttons below — no coding needed. Select text, then choose Heading, Bold, or Link.
      </p>
      <div className="email-body-editor__toolbar" role="toolbar" aria-label="Message formatting">
        <select
          className="email-body-editor__select"
          defaultValue="p"
          onChange={(e) => {
            applyHeading(e.target.value);
            e.target.value = 'p';
          }}
          aria-label="Paragraph style"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <button type="button" onClick={() => run('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => run('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => run('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => run('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" onClick={() => run('insertOrderedList')} title="Numbered list">
          1. List
        </button>
        <button type="button" onClick={applyLink} title="Add link">
          Link
        </button>
        <button type="button" onClick={() => run('removeFormat')} title="Clear formatting">
          Clear
        </button>
      </div>
      <div
        ref={fieldRef}
        className="email-body-editor__surface"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder="Type the email message here..."
        onInput={emitChange}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        suppressContentEditableWarning
      />
    </div>
  );
});

EmailBodyEditor.displayName = 'EmailBodyEditor';

export default EmailBodyEditor;
