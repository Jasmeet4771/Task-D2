
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { currentUser, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        DEV@Deakin
      </Link>

      <input
        className="navbar-search"
        type="search"
        placeholder="Search..."
        aria-label="Search"
      />

      <nav className="navbar-actions">

        <Link to="/browse-posts" className="navbar-post">
          Browse Posts
        </Link>

        <Link to="/pricing" className="navbar-post">
          Pricing
        </Link>

        <Link to="/post" className="navbar-post">
          Post
        </Link>

        {!loading && (
          currentUser ? (
            <>
              <span className="navbar-user">
                {currentUser.displayName || currentUser.email}
              </span>

              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-login">
              Login
            </Link>
          )
        )}

      </nav>
    </header>
  );
}

export default Navbar;
