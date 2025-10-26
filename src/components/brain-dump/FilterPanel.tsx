import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
}

export function FilterPanel({
  categories,
  selectedCategories,
  onCategoryToggle,
  searchQuery,
  onSearchChange,
  isSelectMode,
  onToggleSelectMode,
  selectedCount,
}: FilterPanelProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search thoughts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant={isSelectMode ? "default" : "outline"}
          onClick={onToggleSelectMode}
        >
          {isSelectMode ? `Cancel (${selectedCount})` : "Select"}
        </Button>
      </div>

      {categories.length > 0 && (
        <Collapsible
          open={isCategoriesExpanded}
          onOpenChange={setIsCategoriesExpanded}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between"
            >
              <span className="font-medium">
                Categories ({categories.length})
              </span>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isCategoriesExpanded && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <ScrollArea className="h-32 pr-4">
              <div className="flex flex-wrap gap-2 pb-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => onCategoryToggle(category.id)}
                  >
                    {category.name}
                    {selectedCategories.includes(category.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}