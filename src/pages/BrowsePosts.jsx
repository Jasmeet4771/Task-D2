
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "./BrowsePosts.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function BrowsePosts() {
  const [posts, setPosts] = useState([]);
  const [userPlan, setUserPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load posts.");
      }

      setPosts(data.posts || []);
      setUserPlan(data.userPlan || "free");
    } catch (err) {
      setError(err.message || "Something went wrong while loading posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleExpand = (postId) => {
    setExpandedPosts((previous) =>
      previous.includes(postId)
        ? previous.filter((id) => id !== postId)
        : [...previous, postId]
    );
  };

  const hidePost = (postId) => {
    setHiddenPosts((previous) => [...previous, postId]);
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setPlanFilter("all");
    setFromDate("");
    setToDate("");
    setTagFilter("");
    setHiddenPosts([]);
    setExpandedPosts([]);
  };

  const getPostDate = (post) => {
    if (!post.createdAt) return null;
    return new Date(post.createdAt);
  };

  const filteredPosts = posts.filter((post) => {
    if (hiddenPosts.includes(post.id)) return false;

    if (typeFilter !== "all" && post.type !== typeFilter) return false;

    if (planFilter !== "all" && post.plan !== planFilter) return false;

    const postDate = getPostDate(post);

    if (fromDate && (!postDate || postDate < new Date(`${fromDate}T00:00:00`))) {
      return false;
    }

    if (
      toDate &&
      (!postDate || postDate > new Date(`${toDate}T23:59:59.999`))
    ) {
      return false;
    }

    if (tagFilter.trim()) {
      const searchTag = tagFilter.trim().toLowerCase();
      const tags = Array.isArray(post.tags) ? post.tags : [];

      if (!tags.some((tag) => tag.toLowerCase().includes(searchTag))) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    return new Date(dateValue).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="browse-page">
      <section className="browse-heading">
        <p className="browse-eyebrow">DEV@Deakin Community</p>
        <h1>Browse Posts</h1>
        <p>
          Explore questions and articles shared by the DEV@Deakin community.
        </p>
        <span className="browse-plan">
          Your plan: <strong>{userPlan.toUpperCase()}</strong>
        </span>
      </section>

      <section className="browse-filters">
        <div className="filter-heading">
          <h2>Filter Posts</h2>
          <button type="button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>

        <div className="filter-grid">
          <label>
            Post Type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Question">Questions</option>
              <option value="Article">Articles</option>
            </select>
          </label>

          <label>
            Plan
            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              {userPlan === "paid" && (
                <option value="paid">Paid</option>
              )}
            </select>
          </label>

          <label>
            From Date
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            To Date
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              min={fromDate || undefined}
            />
          </label>

          <label className="tag-filter">
            Filter by Tag
            <input
              type="text"
              placeholder="Enter a tag..."
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="posts-section">
        <div className="posts-heading">
          <h2>Community Posts</h2>
          <span>{filteredPosts.length} posts found</span>
        </div>

        {loading && <p className="browse-message">Loading posts...</p>}

        {!loading && error && (
          <div className="browse-error">
            <p>{error}</p>
            <button type="button" onClick={fetchPosts}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="empty-posts">
            <h3>No posts found</h3>
            <p>Try changing your filters or resetting them.</p>
          </div>
        )}

        {!loading && !error && filteredPosts.length > 0 && (
          <div className="posts-grid">
            {filteredPosts.map((post) => {
              const isExpanded = expandedPosts.includes(post.id);
              const isArticle = post.type === "Article";

              return (
                <article className="post-card" key={post.id}>
                  <div className="post-card-top">
                    <span
                      className={`post-type ${
                        isArticle ? "article-type" : "question-type"
                      }`}
                    >
                      {post.type}
                    </span>

                    <span
                      className={`post-plan ${
                        post.plan === "paid" ? "paid-plan" : "free-plan"
                      }`}
                    >
                      {post.plan || "free"}
                    </span>
                  </div>

                  <h3>{post.title}</h3>

                  <div className="post-meta">
                    <span>By {post.authorName || "Community Member"}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>

                  {isArticle ? (
                    <>
                      <p className="post-preview">
                        {post.abstract}
                      </p>

                      {isExpanded && (
                        <div className="post-full-content">
                          {post.articleText}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="post-preview">
                        {post.description}
                      </p>
                    </>
                  )}

                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag, index) => (
                        <span key={`${tag}-${index}`}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="post-card-actions">
                    {isArticle && (
                      <button
                        type="button"
                        className="read-more-button"
                        onClick={() => toggleExpand(post.id)}
                      >
                        {isExpanded ? "Show Less" : "Read More"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="hide-post-button"
                      onClick={() => hidePost(post.id)}
                    >
                      Hide
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default BrowsePosts;
