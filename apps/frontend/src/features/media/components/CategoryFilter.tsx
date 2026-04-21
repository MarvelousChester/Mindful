import { useMemo, useState } from 'react'

interface CategoryFilterProps {
  categories: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  languages: string[]
  selectedLanguages: string[]
  onLanguageChange: (selected: string[]) => void
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
  selected,
  onChange,
  languages,
  selectedLanguages,
  onLanguageChange,
}: CategoryFilterProps) {
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const topLanguages = useMemo(() => languages.slice(0, 5), [languages])
  const visibleLanguages = useMemo(() => {
    if (showAllLanguages || languages.length <= 5) return languages
    const pinnedSelected = selectedLanguages.filter((language) => !topLanguages.includes(language))
    return [...topLanguages, ...pinnedSelected]
  }, [showAllLanguages, languages, selectedLanguages, topLanguages])

  /**
   * Function: handleToggle
   * Description: Adds or removes a category from the selected list.
   * Params:
   * - value: the category value to toggle
   * Returns: void
   */
  function handleToggle(value: string) {
    if (selected.includes(value)) {
      onChange([])
    } else {
      onChange([value])
    }
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
          <label key={language} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              value={language}
              checked={selectedLanguages.includes(language)}
              onChange={() => handleLanguageToggle(language)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
              {language}
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
          <label key={tag} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              value={tag}
              checked={selected.includes(tag)}
              onChange={() => handleToggle(tag)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
              {tag}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
