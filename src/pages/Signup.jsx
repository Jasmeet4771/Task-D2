
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const fullName = name.trim();

    // Validate full name
    if (fullName.split(/\s+/).length < 2) {
      setError("Please enter your first and last name.");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Authentication account
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Save user's name to Firebase Authentication profile
      await updateProfile(result.user, {
        displayName: fullName
      });

      // Save profile details in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        fullName,
        email: result.user.email,
        createdAt: new Date().toISOString()
      });

      // Sign out so the user can log in
      await signOut(auth);

      // Redirect to login page
      navigate("/login", {
        state: {
          message: "Account created! Please log in."
        }
      });
    } catch (err) {
      console.error("Signup error:", err);

      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email already has an account. Please log in."
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError(
          "Your password is too weak. Please choose a stronger password."
        );
      } else if (err.code === "permission-denied") {
        setError(
          "Unable to save your profile. Please check your Firestore security rules."
        );
      } else {
        setError(
          "Could not create your account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card signup-card">
        <h2>Create a DEV@Deakin Account</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Name*</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Enter your full name"
            required
          />

          <label htmlFor="signup-email">Email*</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="signup-password">Password*</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            placeholder="Enter your password"
            required
          />

          <label htmlFor="signup-confirm">
            Confirm password*
          </label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
            placeholder="Confirm your password"
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;
