"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck, FaChevronDown } from "react-icons/fa";

export interface GlassOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: GlassOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

const MENU_MAX_HEIGHT = 280;

// Replacement for <select>: the browser draws native option lists itself, so
// they cannot follow the glass theme. This menu is rendered in a portal (so
// modals with overflow or blur never clip or shift it) and supports keyboard.
function GlassSelect({ value, options, onChange, className = "", ariaLabel }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [active, setActive] = useState(0);

  const current = options.find((o) => o.value === value);

  const openMenu = () => {
    if (!buttonRef.current) return;
    setRect(buttonRef.current.getBoundingClientRect());
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    closeMenu();
    buttonRef.current?.focus();
  };

  // close on outside click, scroll of the page, resize
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [open]);

  // keep the highlighted item visible
  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      closeMenu();
    }
  };

  // open upwards when there is no room below
  const placeAbove =
    rect !== null && rect.bottom + MENU_MAX_HEIGHT + 12 > window.innerHeight && rect.top > MENU_MAX_HEIGHT / 2;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className={`glass-select inline-flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className="truncate">{current?.label ?? ""}</span>
        <FaChevronDown
          className={`shrink-0 text-[0.7rem] opacity-70 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="glass-menu"
            // keep parent "click outside" handlers (e.g. the Add Snippet modal) from closing
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: rect.left,
              minWidth: rect.width,
              maxHeight: MENU_MAX_HEIGHT,
              ...(placeAbove
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
            }}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                data-index={index}
                className={`glass-menu-item ${index === active ? "is-active" : ""} ${
                  option.value === value ? "is-selected" : ""
                }`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(index)}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <FaCheck className="shrink-0 text-[0.7rem]" />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default GlassSelect;
