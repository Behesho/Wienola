import { useState } from 'react'
import { SearchIcon } from '../../components/icons/NavIcons'
import './SearchPage.css'

function SearchPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="search-page">
      <h1 className="search-page__title">Suchen</h1>

      <label className="search-page__field">
        <SearchIcon className="search-page__field-icon" />
        <input
          type="search"
          placeholder="Aufträge, Angebote, Adressen…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="search-page__empty">
        <p>Keine Ergebnisse.</p>
      </div>
    </div>
  )
}

export default SearchPage
