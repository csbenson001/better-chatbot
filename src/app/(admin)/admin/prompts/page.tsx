"use client";

import { useState } from "react";
import { mutate } from "swr";
import {
  useAdminPromptCategories,
  useAdminPromptItems,
  revalidatePromptCategories,
} from "@/hooks/queries/use-prompt-categories";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Textarea } from "ui/textarea";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ChevronRight } from "lucide-react";
import type { PromptCategory, PromptItem } from "app-types/prompt";

function CategoryDialog({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: PromptCategory;
}) {
  const isEdit = !!category;
  const [label, setLabel] = useState(category?.label ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [sequence, setSequence] = useState(category?.sequence ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim() || !icon.trim()) {
      toast.error("Label and icon are required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/prompt-categories/${category!.id}`
        : "/api/admin/prompt-categories";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, icon, sequence, enabled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Category updated" : "Category created");
      await revalidatePromptCategories();
      onClose();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Write"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Icon (lucide name)
            </label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="PenLine"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use a valid lucide-react icon name, e.g. PenLine, Code2, Smile
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sequence</label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  open,
  onClose,
  categoryId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  item?: PromptItem;
}) {
  const isEdit = !!item;
  const [label, setLabel] = useState(item?.label ?? "");
  const [prompt, setPrompt] = useState(item?.prompt ?? "");
  const [sequence, setSequence] = useState(item?.sequence ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim() || !prompt.trim()) {
      toast.error("Label and prompt are required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/prompt-items/${item!.id}`
        : `/api/admin/prompt-categories/${categoryId}/items`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, prompt, sequence, enabled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Prompt updated" : "Prompt created");
      await mutate(`/api/admin/prompt-categories/${categoryId}/items`);
      await revalidatePromptCategories();
      onClose();
    } catch {
      toast.error("Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Prompt" : "Add Prompt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Improve my essay"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Prompt text (injected into chat)
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="I'd like help improving my essay..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sequence</label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PromptsAdminPage() {
  const { categories, isLoading } = useAdminPromptCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const { items, isLoading: itemsLoading } =
    useAdminPromptItems(selectedCategoryId);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    PromptCategory | undefined
  >();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PromptItem | undefined>();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleDeleteCategory = async (category: PromptCategory) => {
    if (!confirm(`Delete category "${category.label}" and all its prompts?`))
      return;
    try {
      await fetch(`/api/admin/prompt-categories/${category.id}`, {
        method: "DELETE",
      });
      toast.success("Category deleted");
      if (selectedCategoryId === category.id) setSelectedCategoryId(null);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleToggleCategory = async (category: PromptCategory) => {
    try {
      await fetch(`/api/admin/prompt-categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !category.enabled }),
      });
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteItem = async (item: PromptItem) => {
    if (!confirm(`Delete prompt "${item.label}"?`)) return;
    try {
      await fetch(`/api/admin/prompt-items/${item.id}`, { method: "DELETE" });
      toast.success("Prompt deleted");
      await mutate(`/api/admin/prompt-categories/${selectedCategoryId}/items`);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to delete prompt");
    }
  };

  const handleToggleItem = async (item: PromptItem) => {
    try {
      await fetch(`/api/admin/prompt-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      await mutate(`/api/admin/prompt-categories/${selectedCategoryId}/items`);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to update prompt");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            Quick Prompts
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure the prompt suggestion buttons shown on the home screen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Panel */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">Categories</h2>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
              onClick={() => {
                setEditingCategory(undefined);
                setCategoryDialogOpen(true);
              }}
            >
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-zinc-800 rounded animate-pulse"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No categories yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors ${
                    selectedCategoryId === cat.id ? "bg-zinc-800" : ""
                  }`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <ChevronRight className="size-3.5 text-zinc-500 shrink-0" />
                  <span className="flex-1 text-sm text-zinc-200">
                    {cat.label}
                  </span>
                  <span className="text-xs text-zinc-500">{cat.icon}</span>
                  <Badge
                    variant={cat.enabled ? "default" : "secondary"}
                    className="text-xs cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCategory(cat);
                    }}
                  >
                    {cat.enabled ? "On" : "Off"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-zinc-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Panel */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">
              {selectedCategory
                ? `Prompts — ${selectedCategory.label}`
                : "Prompts"}
            </h2>
            {selectedCategoryId && (
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
                onClick={() => {
                  setEditingItem(undefined);
                  setItemDialogOpen(true);
                }}
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            )}
          </div>

          {!selectedCategoryId ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Select a category to manage its prompts.
            </div>
          ) : itemsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-zinc-800 rounded animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No prompts yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{item.label}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {item.prompt}
                    </p>
                  </div>
                  <Badge
                    variant={item.enabled ? "default" : "secondary"}
                    className="text-xs cursor-pointer shrink-0"
                    onClick={() => handleToggleItem(item)}
                  >
                    {item.enabled ? "On" : "Off"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-zinc-100 shrink-0"
                    onClick={() => {
                      setEditingItem(item);
                      setItemDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-destructive shrink-0"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(undefined);
        }}
        category={editingCategory}
      />

      {selectedCategoryId && (
        <ItemDialog
          open={itemDialogOpen}
          onClose={() => {
            setItemDialogOpen(false);
            setEditingItem(undefined);
          }}
          categoryId={selectedCategoryId}
          item={editingItem}
        />
      )}
    </div>
  );
}
