"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  full_name: string | null;
  email: string;
};

export function MentionTextarea({
  members,
  name,
  placeholder,
  required,
  className,
  value: controlledValue,
  onChange: controlledOnChange,
  textareaRef: externalRef,
}: {
  members: Member[];
  name: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [value, setValue] = useState(controlledValue || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRefToUse = externalRef || internalRef;

  const currentValue = controlledValue !== undefined ? controlledValue : value;

  const filtered = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const firstName = (m.full_name || "").split(" ")[0].toLowerCase();
    const fullName = (m.full_name || "").toLowerCase();
    const email = m.email.toLowerCase();
    return firstName.includes(q) || fullName.includes(q) || email.includes(q);
  });

  const updateValue = useCallback(
    (v: string) => {
      if (controlledOnChange) controlledOnChange(v);
      else setValue(v);
    },
    [controlledOnChange]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    updateValue(newValue);
    setCursorPos(pos);

    const textBeforeCursor = newValue.slice(0, pos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex >= 0) {
      const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
      if (charBefore === " " || charBefore === "\n" || atIndex === 0) {
        const mentionQuery = textBeforeCursor.slice(atIndex + 1);
        if (!mentionQuery.includes(" ") || mentionQuery.length <= 20) {
          setMentionStart(atIndex);
          setQuery(mentionQuery);
          setShowDropdown(true);
          setSelectedIndex(0);
          return;
        }
      }
    }

    setShowDropdown(false);
  }

  function insertMention(member: Member) {
    const firstName = (member.full_name || member.email.split("@")[0]).split(" ")[0];
    const before = currentValue.slice(0, mentionStart);
    const after = currentValue.slice(cursorPos);
    const newValue = `${before}@${firstName} ${after}`;
    updateValue(newValue);
    setShowDropdown(false);

    requestAnimationFrame(() => {
      const el = textareaRefToUse.current;
      if (el) {
        const newPos = mentionStart + firstName.length + 2;
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selected = dropdownRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRefToUse as React.RefObject<HTMLTextAreaElement>}
        name={name}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        required={required}
        rows={1}
        className={cn("resize-none", className)}
      />
      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-popover border border-bc-divider rounded-md shadow-lg z-50"
        >
          {filtered.map((member, index) => {
            const initials = member.full_name
              ? member.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : member.email[0].toUpperCase();

            return (
              <button
                key={member.id}
                type="button"
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted",
                  index === selectedIndex && "bg-muted"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(member);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {member.full_name || member.email}
                  </p>
                  {member.full_name && (
                    <p className="text-xs text-bc-meta truncate">{member.email}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
