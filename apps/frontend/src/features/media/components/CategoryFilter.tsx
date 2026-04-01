interface CategoryFilterProps {
  categories: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

/**
 * Function: CategoryFilter
 * Description: Renders a list of category checkboxes for filtering tracks.
 * Params:
 * - categories: list of available category labels derived from the current track list
 * - selected: array of currently selected category values
 * - onChange: callback fired with the updated selected array on checkbox toggle
 * Returns: A JSX box with one checkbox per category
 */
export function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  /**
   * Function: handleToggle
   * Description: Adds or removes a category from the selected list.
   * Params:
   * - value: the category value to toggle
   * Returns: void
   */
  function handleToggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-3">
      {categories.map((tag) => (
        <label key={tag} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            value={tag.toLowerCase()}
            checked={selected.includes(tag.toLowerCase())}
            onChange={() => handleToggle(tag.toLowerCase())}
            className="accent-primary w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {tag}
          </span>
        </label>
      ))}
    </div>
  )
}
