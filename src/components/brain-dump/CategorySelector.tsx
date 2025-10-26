import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/thought.types';

interface CategorySelectorProps {
  thoughtId: string;
  existingCategoryIds: string[];
  availableCategories: Category[];
  onAddCategory: (thoughtId: string, categoryName: string) => void;
}

export function CategorySelector({
  thoughtId,
  existingCategoryIds,
  availableCategories,
  onAddCategory
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filter out already-added categories
  const selectableCategories = availableCategories.filter(
    cat => !existingCategoryIds.includes(cat.id)
  );

  // Filter by search value (case-insensitive)
  const filteredCategories = searchValue
    ? selectableCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : selectableCategories;

  // Limit to top 5 matches for better UX (no endless scrolling)
  const displayedCategories = filteredCategories.slice(0, 5);
  const hasMoreCategories = filteredCategories.length > 5;

  // Check if search creates a new category
  const isNewCategory = searchValue.trim() && 
    !availableCategories.some(cat => 
      cat.name.toLowerCase() === searchValue.trim().toLowerCase()
    );

  const handleSelect = (categoryName: string) => {
    onAddCategory(thoughtId, categoryName);
    setSearchValue('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-muted"
        >
          <Plus className="h-3 w-3" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or create category..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {isNewCategory ? (
              <div 
                className="p-2 text-sm cursor-pointer hover:bg-muted"
                onClick={() => handleSelect(searchValue.trim())}
              >
                <Plus className="inline mr-2 h-4 w-4" />
                Create "{searchValue.trim()}"
              </div>
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No categories found
              </div>
            )}
          </CommandEmpty>
          {displayedCategories.length > 0 && (
            <CommandGroup heading="Existing Categories">
              {displayedCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => handleSelect(category.name)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {category.name}
                </CommandItem>
              ))}
              {hasMoreCategories && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  ...and {filteredCategories.length - 5} more. Keep typing to filter.
                </div>
              )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

