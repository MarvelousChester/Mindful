import { useMemo, useState } from 'react'

export interface FilterOption {
  count: number
  name: string
}

interface CategoryFilterProps {
  categories: FilterOption[]
  selectedCategory: string | null
  onCategoryChange: (selected: string | null) => void
  languages: FilterOption[]
  selectedLanguages: string[]
  onLanguageChange: (selected: string[]) => void
  disabled?: boolean
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
export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  languages,
  selectedLanguages,
  onLanguageChange,
  disabled = false,
}: CategoryFilterProps) {
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const topLanguages = useMemo(() => languages.slice(0, 5), [languages])
  const visibleLanguages = useMemo(() => {
    if (showAllLanguages || languages.length <= 5) return languages
    const topLanguageNames = new Set(topLanguages.map((language) => language.name))
    const pinnedSelected = languages.filter(
      (language) => selectedLanguages.includes(language.name) && !topLanguageNames.has(language.name),
    )
    return [...topLanguages, ...pinnedSelected]
  }, [showAllLanguages, languages, selectedLanguages, topLanguages])

  function handleCategoryToggle(value: string) {
    onCategoryChange(selectedCategory === value ? null : value)
  }

  function handleLanguageToggle(value: string) {
    if (selectedLanguages.includes(value)) {
      onLanguageChange(selectedLanguages.filter((language) => language !== value))
      return
    }
    onLanguageChange([...selectedLanguages, value])
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Language</h3>
        {visibleLanguages.map((language) => (
          <label
            key={language.name}
            className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-60' : ''}`}
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                value={language.name}
                checked={selectedLanguages.includes(language.name)}
                onChange={() => handleLanguageToggle(language.name)}
                disabled={disabled}
                className="accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                {language.name}
              </span>
            </span>
          </label>
        ))}
        {languages.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllLanguages((value) => !value)}
            className="self-start text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            {showAllLanguages ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Categories</h3>
        {categories.map((tag) => (
          <button
            key={tag.name}
            type="button"
            onClick={() => handleCategoryToggle(tag.name)}
            disabled={disabled}
            aria-pressed={selectedCategory === tag.name}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
              selectedCategory === tag.name
                ? 'border-primary/60 bg-primary/15 text-slate-900'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            } ${disabled ? 'opacity-60' : ''}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )
}
