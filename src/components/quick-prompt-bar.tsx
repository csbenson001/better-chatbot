"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { usePromptCategories } from "@/hooks/queries/use-prompt-categories";
import { cn } from "lib/utils";
import type { PromptCategoryWithItems } from "app-types/prompt";

interface QuickPromptBarProps {
  onPromptSelect: (prompt: string) => void;
}

function CategoryIcon({ iconName }: { iconName: string }) {
  const Icon = (LucideIcons as any)[iconName];
  if (!Icon) return null;
  return <Icon className="size-3.5 shrink-0" />;
}

function CategoryPopover({
  category,
  isOpen,
  onOpenChange,
  onSelect,
}: {
  category: PromptCategoryWithItems;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (prompt: string) => void;
}) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 text-xs font-medium shrink-0",
            isOpen && "bg-accent",
          )}
        >
          <CategoryIcon iconName={category.icon} />
          {category.label}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-1"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {category.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.prompt);
                onOpenChange(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function QuickPromptBar({ onPromptSelect }: QuickPromptBarProps) {
  const { categories, isLoading } = usePromptCategories();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 justify-center flex-wrap px-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap px-4 py-2">
      {categories.map((category) => (
        <CategoryPopover
          key={category.id}
          category={category}
          isOpen={openCategoryId === category.id}
          onOpenChange={(open) => setOpenCategoryId(open ? category.id : null)}
          onSelect={onPromptSelect}
        />
      ))}
    </div>
  );
}
