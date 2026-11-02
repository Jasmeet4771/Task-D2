
import { useState } from "react";
import { auth } from "../firebase";
import "./Post.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function Post() {
  const [postType, setPostType] = useState("Question");
  const [postPlan, setPostPlan] = useState("free");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [abstract, setAbstract] = useState("");
  const [articleText, setArticleText] = useState("");
  const [tags, setTags] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    // 1. Check authentication
    const user = auth.currentUser;

    if (!user) {
      setMessageType("error");
      setMessage("Please log in before creating a post.");
      return;
    }

    // 2. Validate form data
    const enteredTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (title.trim().length < 4 || title.trim().length > 120) {
      setMessageType("error");
      setMessage("Title must be between 4 and 120 characters.");
      return;
    }

    if (
      enteredTags.length < 1 ||
      enteredTags.length > 3 ||
      enteredTags.some((tag) => tag.length > 30)
    ) {
      setMessageType("error");
      setMessage("Please enter between 1 and 3 valid tags.");
      return;
    }

    if (
      postType === "Question" &&
      description.trim().length < 10
    ) {
      setMessageType("error");
      setMessage("Question details must contain at least 10 characters.");
      return;
    }

    if (
      postType === "Article" &&
      (
        abstract.trim().length < 10 ||
        articleText.trim().length < 50
      )
    ) {
      setMessageType("error");
      setMessage(
        "Abstract must contain at least 10 characters and article text at least 50."
      );
      return;
    }

    // 3. Send post to backend
    setSaving(true);

    try {
      const idToken = await user.getIdToken();

      const payload = {
        type: postType,
        plan: postPlan,
        title: title.trim(),
        tags: enteredTags,

        ...(postType === "Question"
          ? {
              description: description.trim(),
            }
          : {
              abstract: abstract.trim(),
              articleText: articleText.trim(),
            }),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to publish your post."
        );
      }

      // 4. Show success
      setMessageType("success");
      setMessage(result.message);

      // 5. Reset form
      setPostType("Question");
      setPostPlan("free");
      setTitle("");
      setDescription("");
      setAbstract("");
      setArticleText("");
      setTags("");

    } catch (error) {
      console.error("Post submission error:", error);

      setMessageType("error");
      setMessage(
        error.message || "Unable to publish your post."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="post-page">

      <form className="post-form" onSubmit={handleSubmit}>

        <h2>New Post</h2>

        {/* Post Type */}
        <div className="post-type">
          <strong>Select Post Type:</strong>

          <label>
            <input
              type="radio"
              name="postType"
              value="Question"
              checked={postType === "Question"}
              onChange={(e) => setPostType(e.target.value)}
            />
            Question
          </label>

          <label>
            <input
              type="radio"
              name="postType"
              value="Article"
              checked={postType === "Article"}
              onChange={(e) => setPostType(e.target.value)}
            />
            Article
          </label>
        </div>

        {/* Subscription Plan */}
        <div className="post-type">
          <strong>Select Post Plan:</strong>

          <label>
            <input
              type="radio"
              name="postPlan"
              value="free"
              checked={postPlan === "free"}
              onChange={(e) => setPostPlan(e.target.value)}
            />
            Free
          </label>

          <label>
            <input
              type="radio"
              name="postPlan"
              value="paid"
              checked={postPlan === "paid"}
              onChange={(e) => setPostPlan(e.target.value)}
            />
            Paid
          </label>
        </div>

        <h3>What do you want to ask or share?</h3>

        <p className="post-help">
          Select Question or Article to display the relevant fields.
        </p>

        {/* Title */}
        <label htmlFor="post-title">Title</label>

        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title"
          maxLength={120}
          required
        />

        {/* Question Fields */}
        {postType === "Question" ? (
          <>
            <label htmlFor="post-description">
              Describe your problem
            </label>

            <textarea
              id="post-description"
              rows="9"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain your problem..."
              maxLength={5000}
              required
            />
          </>
        ) : (
          /* Article Fields */
          <>
            <label htmlFor="post-abstract">
              Abstract
            </label>

            <textarea
              id="post-abstract"
              rows="3"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Enter a short abstract"
              maxLength={500}
              required
            />

            <label htmlFor="post-article-text">
              Article Text
            </label>

            <textarea
              id="post-article-text"
              rows="9"
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Write your article..."
              maxLength={20000}
              required
            />
          </>
        )}

        {/* Tags */}
        <label htmlFor="post-tags">Tags</label>

        <input
          id="post-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Add 1–3 comma-separated tags, e.g. React, JavaScript"
          required
        />

        {/* Submit */}
        <button
          className="post-submit"
          type="submit"
          disabled={saving}
        >
          {saving ? "Publishing..." : "Post"}
        </button>

        {/* Notifications */}
        {message && (
          <p
            className={
              messageType === "error"
                ? "post-error"
                : "post-success"
            }
            role={messageType === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message}
          </p>
        )}

      </form>

    </main>
  );
}

export default Post;
