
import { useState } from "react";

function Newsletter() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setMessage("Please enter your email address.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Subscription failed."
                );
            }

            setMessage(data.message);
            setMessageType("success");
            setEmail("");
        } catch (error) {
            console.error("Newsletter subscription error:", error);

            setMessage(
                error.message || "Something went wrong. Please try again."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="newsletter">
            <div className="newsletter-content">
                <h2>SIGN UP FOR OUR DAILY INSIDER</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={loading}
                        aria-label="Email address"
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Subscribing..." : "Subscribe"}
                    </button>
                </form>
            </div>

            {message && (
                <p
                    className={`newsletter-message ${messageType}`}
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </p>
            )}
        </section>
    );
}

export default Newsletter;
