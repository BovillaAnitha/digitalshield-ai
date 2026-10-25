
import { useEffect, useState } from "react";

const API = "https://digitalshield-ai-api.onrender.com";
export default function IncidentSearch() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadIncidents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/incidents`);

      if (!response.ok) {
        throw new Error("Unable to load incidents.");
      }

      const data = await response.json();

      // Supports both an array and an { incidents: [...] } response.
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.incidents)
        ? data.incidents
        : [];

      setIncidents(items);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  const categories = [
    "All",
    ...new Set(
      incidents
        .map((incident) => incident.category)
        .filter(Boolean)
    ),
  ];

  const filtered = incidents
    .filter((incident) => {
      const text = [
        incident.title,
        incident.description,
        incident.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory =
        category === "All" || incident.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(
        a.occurred_at || a.created_at || 0
      ).getTime();
      const dateB = new Date(
        b.occurred_at || b.created_at || 0
      ).getTime();

      return sort === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">
            INCIDENT RECORDS
          </span>
          <h2>Search Incident History</h2>
          <p className="muted">
            Find and review previously documented incidents.
          </p>
        </div>

        <button type="button" onClick={loadIncidents}>
          ↻ Refresh
        </button>
      </div>

      <div className="incident-search-controls">
        <label>
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description..."
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      {loading && <p className="muted">Loading incidents...</p>}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="muted">
            Showing {filtered.length} of {incidents.length} incidents
          </p>

          {filtered.length === 0 ? (
            <p className="muted">
              No incidents match your search.
            </p>
          ) : (
            filtered.map((incident, index) => (
              <article
                key={incident.id ?? index}
                className="timeline-item"
              >
                <div className="finding-title">
                  <strong>{incident.title || "Untitled Incident"}</strong>
                  <span className="feature-pill">
                    {incident.category || "Uncategorized"}
                  </span>
                </div>

                <p>
                  {incident.description || "No description provided."}
                </p>

                <p className="muted">
                  Date:{" "}
                  {incident.occurred_at
                    ? new Date(incident.occurred_at).toLocaleString()
                    : "Not specified"}
                </p>
              </article>
            ))
          )}
        </>
      )}
    </section>
  );
}
