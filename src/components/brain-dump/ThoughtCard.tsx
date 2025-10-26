import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Edit2, MoreVertical, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CategorySelector } from "./CategorySelector";
import { Category } from "@/types/thought.types";

interface ThoughtCardProps {
  thought: {
    id: string;
    title: string;
    snippet: string | null;
    status: string;
    is_completed?: boolean;
    thought_categories?: Array<{ categories: { id: string; name: string } }>;
  };
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onMarkDone?: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (id: string) => void;
  onRemoveCategory?: (thoughtId: string, categoryId: string) => void;
  onAddCategory?: (thoughtId: string, categoryName: string) => Promise<void>;
  onCategoryClick?: (categoryId: string) => void;
  selectedCategoryIds?: string[];
  availableCategories?: Category[];
  showRemoveFromCluster?: boolean;
  onRemoveFromCluster?: () => void;
}

export function ThoughtCard({
  thought,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onMarkDone,
  onArchive,
  onEdit,
  onRemoveCategory,
  onAddCategory,
  onCategoryClick,
  selectedCategoryIds = [],
  availableCategories,
  showRemoveFromCluster,
  onRemoveFromCluster,
}: ThoughtCardProps) {
  const [showDone, setShowDone] = useState(false);
  const isCompleted = thought.is_completed || false;

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-all duration-300 group relative",
        isCompleted && "opacity-50 bg-muted/30"
      )}
      onMouseEnter={() => setShowDone(true)}
      onMouseLeave={() => setShowDone(false)}
    >
      {isSelectMode && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(thought.id)}
          />
        </div>
      )}

      {showDone && !isSelectMode && (
        <Button
          size="icon"
          variant={isCompleted ? "default" : "ghost"}
          className={cn(
            "absolute top-2 right-2 z-10 transition-colors",
            isCompleted && "bg-green-500 hover:bg-green-600"
          )}
          onClick={() => onMarkDone?.(thought.id)}
        >
          <Check className={cn(
            "h-4 w-4",
            isCompleted && "text-white"
          )} />
        </Button>
      )}

      <div className={isSelectMode ? "ml-8" : ""}>
        <h3 className={cn(
          "font-semibold mb-2 line-clamp-2",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {thought.title}
        </h3>
        {thought.snippet && (
          <p className={cn(
            "text-sm text-muted-foreground mb-3 line-clamp-3",
            isCompleted && "opacity-60"
          )}>
            {thought.snippet}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {thought.thought_categories?.map((tc) => {
            const isSelected = selectedCategoryIds.includes(tc.categories.id);
            return (
              <Badge
                key={tc.categories.id}
                variant={isSelected ? "default" : "secondary"}
                className={cn(
                  "group/badge cursor-pointer min-h-7 min-w-11 transition-all",
                  isCompleted && "opacity-60",
                  isSelected && "ring-2 ring-primary ring-offset-1"
                )}
                role="button"
                aria-pressed={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick?.(tc.categories.id);
                }}
              >
                {tc.categories.name}
                <X
                  className="ml-1 h-3 w-3 opacity-0 group-hover/badge:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCategory?.(thought.id, tc.categories.id);
                  }}
                />
              </Badge>
            );
          })}
          
          {onAddCategory && availableCategories && (
            <CategorySelector
              thoughtId={thought.id}
              existingCategoryIds={thought.thought_categories?.map(tc => tc.categories.id) || []}
              availableCategories={availableCategories}
              onAddCategory={onAddCategory}
            />
          )}
        </div>

        {isCompleted && (
          <Badge variant="outline" className="mb-2 text-xs">
            <Check className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )}

        <div className="flex justify-end items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover" sideOffset={5}>
              <DropdownMenuItem onClick={() => onEdit?.(thought.id)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {showRemoveFromCluster && onRemoveFromCluster && (
                <DropdownMenuItem 
                  onClick={onRemoveFromCluster}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove from Cluster
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onArchive?.(thought.id)}>
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}