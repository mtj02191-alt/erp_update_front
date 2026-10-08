import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { simpleDebounce } from '../../../../utils/debounce';
import './MentionCommentInput.css';

const getUserLabel = (user) =>
  user?.full_name ||
  `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
  user?.email ||
  `User #${user?.id}`;

const MentionCommentInput = ({
  value = '',
  mentionedUserIds = [],
  onChange,
  onMentionedUsersChange,
  disabled = false,
  placeholder = 'Add Comment (type @ to mention someone)',
  name = 'content',
  rows = 4,
}) => {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [taggedUsers, setTaggedUsers] = useState([]);

  const debouncedSearch = useMemo(
    () =>
      simpleDebounce(async (term) => {
        setLoading(true);
        try {
          const params = term.trim() ? { search: term.trim() } : {};
          const response = await axiosInstance.get('/users/options', { params });
          const results = response.data?.data || response.data || [];
          setSearchResults(Array.isArray(results) ? results.slice(0, 20) : []);
        } catch {
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    if (!mentionOpen) return;
    debouncedSearch(mentionQuery);
  }, [mentionOpen, mentionQuery, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setMentionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const syncMentionedUsers = useCallback(
    (users) => {
      setTaggedUsers(users);
      if (onMentionedUsersChange) {
        onMentionedUsersChange(users.map((u) => Number(u.id)).filter((id) => id > 0));
      }
    },
    [onMentionedUsersChange]
  );

  const detectMention = useCallback((text, cursorPos) => {
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
      setMentionOpen(false);
      return;
    }
    const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';
    if (charBeforeAt && !/\s/.test(charBeforeAt)) {
      setMentionOpen(false);
      return;
    }
    const query = beforeCursor.slice(atIndex + 1);
    if (/\s/.test(query)) {
      setMentionOpen(false);
      return;
    }
    setMentionStart(atIndex);
    setMentionQuery(query);
    setMentionOpen(true);
    setHighlightedIndex(0);
  }, []);

  const handleTextChange = (e) => {
    const nextValue = e.target.value;
    onChange({ target: { name, value: nextValue } });
    const cursorPos = e.target.selectionStart ?? nextValue.length;
    detectMention(nextValue, cursorPos);
  };

  const insertMention = (user) => {
    const label = getUserLabel(user);
    const mentionText = `@${label} `;
    const before = value.slice(0, mentionStart);
    const after = value.slice(
      mentionStart + 1 + mentionQuery.length
    );
    const nextValue = `${before}${mentionText}${after}`;
    onChange({ target: { name, value: nextValue } });

    const alreadyTagged = taggedUsers.some((u) => Number(u.id) === Number(user.id));
    if (!alreadyTagged) {
      syncMentionedUsers([...taggedUsers, user]);
    }

    setMentionOpen(false);
    setMentionQuery('');
    setMentionStart(-1);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = before.length + mentionText.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const removeTaggedUser = (userId) => {
    syncMentionedUsers(taggedUsers.filter((u) => Number(u.id) !== Number(userId)));
  };

  const handleKeyDown = (e) => {
    if (!mentionOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev + 1 >= searchResults.length ? 0 : prev + 1
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev - 1 < 0 ? searchResults.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter' && mentionOpen) {
      e.preventDefault();
      const selected = searchResults[highlightedIndex];
      if (selected) insertMention(selected);
    } else if (e.key === 'Escape') {
      setMentionOpen(false);
    }
  };

  return (
    <div className="mention-comment-input">
      <div className="mention-comment-input__field-wrap">
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => detectMention(e.target.value, e.target.selectionStart)}
          className="form-input mention-comment-input__textarea"
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
        {mentionOpen && (
          <div ref={dropdownRef} className="mention-comment-input__dropdown" role="listbox">
            {loading && (
              <div className="mention-comment-input__dropdown-item mention-comment-input__dropdown-item--muted">
                Searching users...
              </div>
            )}
            {!loading && searchResults.length === 0 && (
              <div className="mention-comment-input__dropdown-item mention-comment-input__dropdown-item--muted">
                No users found
              </div>
            )}
            {!loading &&
              searchResults.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={`mention-comment-input__dropdown-item${
                    index === highlightedIndex
                      ? ' mention-comment-input__dropdown-item--active'
                      : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user);
                  }}
                >
                  <span className="mention-comment-input__user-name">
                    {getUserLabel(user)}
                  </span>
                  {user.email && (
                    <span className="mention-comment-input__user-email">
                      {user.email}
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
      {taggedUsers.length > 0 && (
        <div className="mention-comment-input__tags">
          {taggedUsers.map((user) => (
            <span key={user.id} className="mention-comment-input__tag">
              @{getUserLabel(user)}
              {!disabled && (
                <button
                  type="button"
                  className="mention-comment-input__tag-remove"
                  onClick={() => removeTaggedUser(user.id)}
                  aria-label={`Remove ${getUserLabel(user)}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <p className="mention-comment-input__hint">
        Type <strong>@</strong> to tag users. Tagged users receive an email with this comment.
      </p>
    </div>
  );
};

export default MentionCommentInput;
