import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { getUploadUrl } from '../../utils/mediaHelper';
import './MentionSuggestions.css';

const MentionSuggestions = ({ text, setText, targetInputRef, onSelect }) => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionInfo, setMentionInfo] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchFriends = async () => {
      try {
        const res = await userService.getFollowers(currentUser._id);
        if (res.success) {
          // Filter to mutual friends (friends status)
          const mutual = res.data.filter(u => u.relationshipStatus === 'friends');
          setFriends(mutual);
        }
      } catch (err) {
        console.error('Error fetching friends for suggestions:', err);
      }
    };
    fetchFriends();
  }, [currentUser]);

  useEffect(() => {
    if (!targetInputRef || !targetInputRef.current) return;

    const checkMentions = () => {
      const input = targetInputRef.current;
      const selectionStart = input.selectionStart;
      const textBeforeCursor = text.slice(0, selectionStart);
      
      // Find if last word ends with @username (e.g. "@username" or "@user" or just "@")
      // Matching "@" followed by word characters up to cursor
      const lastWordMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (lastWordMatch) {
        const query = lastWordMatch[1];
        const startIndex = selectionStart - lastWordMatch[0].length;
        setMentionInfo({
          query,
          startIndex,
          endIndex: selectionStart
        });
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
        setMentionInfo(null);
      }
    };

    const handleInputOrKeyUp = () => {
      checkMentions();
    };

    const element = targetInputRef.current;
    element.addEventListener('keyup', handleInputOrKeyUp);
    element.addEventListener('click', handleInputOrKeyUp);
    element.addEventListener('focus', handleInputOrKeyUp);

    // Initial check
    checkMentions();

    return () => {
      element.removeEventListener('keyup', handleInputOrKeyUp);
      element.removeEventListener('click', handleInputOrKeyUp);
      element.removeEventListener('focus', handleInputOrKeyUp);
    };
  }, [text, targetInputRef]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showDropdown && targetInputRef?.current && !targetInputRef.current.contains(e.target) && !e.target.closest('.mention-suggestions-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showDropdown, targetInputRef]);

  if (!showDropdown || !mentionInfo) return null;

  const filtered = friends.filter(friend => 
    friend.username.toLowerCase().includes(mentionInfo.query.toLowerCase()) ||
    friend.fullName.toLowerCase().includes(mentionInfo.query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  const handleSelectFriend = (friend) => {
    const input = targetInputRef.current;
    const before = text.slice(0, mentionInfo.startIndex);
    const after = text.slice(mentionInfo.endIndex);
    const completedText = before + '@' + friend.username + ' ' + after;
    
    setText(completedText);
    setShowDropdown(false);
    setMentionInfo(null);

    // Refocus input and set cursor position correctly
    setTimeout(() => {
      if (input) {
        input.focus();
        const cursorPosition = mentionInfo.startIndex + friend.username.length + 2; // @ + username + space
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);

    if (onSelect) onSelect();
  };

  return (
    <div className="mention-suggestions-dropdown">
      {filtered.map(friend => (
        <div 
          key={friend._id} 
          className="mention-suggestion-item"
          onMouseDown={(e) => {
            // Prevent input blur before click event registers
            e.preventDefault();
          }}
          onClick={() => handleSelectFriend(friend)}
        >
          <img 
            src={getUploadUrl(friend.profilePicture || '/uploads/default-avatar.png')} 
            alt={friend.fullName}
            className="mention-suggestion-avatar"
          />
          <div className="mention-suggestion-info">
            <span className="mention-suggestion-name">{friend.fullName}</span>
            <span className="mention-suggestion-username">@{friend.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionSuggestions;
