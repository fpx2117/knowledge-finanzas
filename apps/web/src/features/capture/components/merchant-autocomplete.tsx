"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { CheckIcon } from "lucide-react";

import { fieldControlClass } from "@/components/shared/form-field";
import { MerchantLogo } from "@/components/financial/merchant-logo";
import { cn } from "@/lib/utils";
import { searchMerchantSuggestionsAction } from "../actions/quick-actions";
import type { MerchantAutocompleteSuggestion } from "../lib/merchant-autocomplete";

export function MerchantAutocomplete({
  id,
  name,
  value,
  placeholder,
  required = false,
  maxLength = 80,
  categories,
  onChange,
  onSelect,
  inputClassName,
}: {
  id: string;
  name: string;
  value: string;
  placeholder: string;
  required?: boolean;
  maxLength?: number;
  categories: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  onSelect: (suggestion: MerchantAutocompleteSuggestion) => void;
  /** Extra classes on the text input (e.g. right padding for an adornment). */
  inputClassName?: string;
}) {
  const listId = useId();
  const deferredValue = useDeferredValue(value.trim());
  const selectedValue = useRef<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<MerchantAutocompleteSuggestion[]>([]);

  useEffect(() => {
    if (!focused || deferredValue.length < 2 || deferredValue === selectedValue.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSuggestions([]);
      setOpen(true);
      setLoading(true);
      searchMerchantSuggestionsAction(deferredValue)
        .then((results) => {
          if (cancelled) return;
          setSuggestions(results);
          setActiveIndex(0);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredValue, focused]);

  function selectSuggestion(suggestion: MerchantAutocompleteSuggestion) {
    selectedValue.current = suggestion.name;
    setSuggestions([]);
    setOpen(false);
    onSelect(suggestion);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && suggestions[activeIndex] ? `${listId}-${suggestions[activeIndex].id}` : undefined}
        autoComplete="off"
        maxLength={maxLength}
        required={required}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setOpen(false);
        }}
        onChange={(event) => {
          selectedValue.current = null;
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(fieldControlClass, inputClassName)}
      />

      {open ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {loading && suggestions.length === 0 ? (
            <p id={listId} role="status" className="px-2 py-3 text-center text-caption text-muted-foreground">
              Buscando comercios…
            </p>
          ) : suggestions.length > 0 ? (
            <div id={listId} role="listbox" aria-label="Comercios sugeridos">
              {suggestions.map((suggestion, index) => {
                const categoryName = categories.find((category) => category.id === suggestion.categoryId)?.name;
                return (
                  <button
                    key={suggestion.id}
                    id={`${listId}-${suggestion.id}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-small outline-none",
                      index === activeIndex ? "bg-secondary" : "hover:bg-secondary",
                    )}
                  >
                    <MerchantLogo name={suggestion.name} domain={suggestion.domain} className="size-7 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{suggestion.name}</span>
                      {categoryName ? (
                        <span className="block truncate text-caption text-muted-foreground">{categoryName}</span>
                      ) : null}
                    </span>
                    {suggestion.name === value ? <CheckIcon className="size-4 text-brand" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p id={listId} role="status" className="px-2 py-3 text-center text-caption text-muted-foreground">
              No encontramos un comercio conocido. Podés usar el nombre escrito.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
