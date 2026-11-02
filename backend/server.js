const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const path = require("path");

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://devdeakinjasmeet4771.vercel.app",
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "50kb" }));

const serviceAccount = require(
  path.join(__dirname, "service-account.json")
);

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

console.log("Firebase Admin initialized successfully.");

async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const token = authHeader.split(" ")[1];
    req.user = await auth.verifyIdToken(token);

    return next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired login session.",
    });
  }
}

async function verifyUserPlan(req, res, next) {
  try {
    const userSnapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .get();

    if (!userSnapshot.exists) {
      return res.status(403).json({
        message: "User profile not found.",
      });
    }

    const userData = userSnapshot.data();

    req.userProfile = {
      ...userData,
      plan: userData.plan === "paid" ? "paid" : "free",
    };

    return next();
  } catch (error) {
    console.error("Subscription verification error:", error);

    return res.status(500).json({
      message: "Unable to verify your subscription.",
    });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.subscriptionPlan = "free";
      return next();
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authentication header.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    const userSnapshot = await db
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    const userData = userSnapshot.exists
      ? userSnapshot.data()
      : {};

    req.user = decodedToken;
    req.subscriptionPlan =
      userData.plan === "paid" ? "paid" : "free";

    return next();
  } catch (error) {
    console.error("Optional authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired login session.",
    });
  }
}

function validatePost(data) {
  const {
    type,
    plan,
    title,
    tags,
    description,
    abstract,
    articleText,
  } = data;

  if (!["Question", "Article"].includes(type)) {
    return "Invalid post type.";
  }

  if (!["free", "paid"].includes(plan)) {
    return "Invalid post plan.";
  }

  if (
    typeof title !== "string" ||
    title.trim().length < 4 ||
    title.trim().length > 120
  ) {
    return "Title must be between 4 and 120 characters.";
  }

  if (
    !Array.isArray(tags) ||
    tags.length < 1 ||
    tags.length > 3
  ) {
    return "Please provide between 1 and 3 tags.";
  }

  if (
    tags.some(
      tag =>
        typeof tag !== "string" ||
        tag.trim().length < 1 ||
        tag.trim().length > 30
    )
  ) {
    return "Each tag must contain between 1 and 30 characters.";
  }

  const normalizedTags = tags.map(
    tag => tag.trim().toLowerCase()
  );

  if (new Set(normalizedTags).size !== normalizedTags.length) {
    return "Duplicate tags are not allowed.";
  }

  if (type === "Question") {
    if (
      typeof description !== "string" ||
      description.trim().length < 10 ||
      description.trim().length > 5000
    ) {
      return "Question details must be between 10 and 5000 characters.";
    }
  }

  if (type === "Article") {
    if (
      typeof abstract !== "string" ||
      abstract.trim().length < 10 ||
      abstract.trim().length > 500
    ) {
      return "Abstract must be between 10 and 500 characters.";
    }

    if (
      typeof articleText !== "string" ||
      articleText.trim().length < 50 ||
      articleText.trim().length > 20000
    ) {
      return "Article text must be between 50 and 20000 characters.";
    }
  }

  return null;
}

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "DEV@Deakin backend is running.",
  });
});

app.post(
  "/api/posts",
  verifyUser,
  verifyUserPlan,
  async (req, res) => {
    try {
      const validationError = validatePost(req.body || {});

      if (validationError) {
        return res.status(400).json({
          message: validationError,
        });
      }

      const {
        type,
        plan,
        title,
        tags,
        description,
        abstract,
        articleText,
      } = req.body;

      if (
        plan === "paid" &&
        req.userProfile.plan !== "paid"
      ) {
        return res.status(403).json({
          message: "Upgrade to the Paid plan to publish Paid posts.",
        });
      }

      const postData = {
        type,
        plan,
        title: title.trim(),
        tags: tags.map(tag => tag.trim().toLowerCase()),
        authorId: req.user.uid,
        authorName:
          req.userProfile.fullName ||
          req.user.name ||
          "DEV@Deakin User",
        createdAt: FieldValue.serverTimestamp(),
      };

      if (type === "Question") {
        postData.description = description.trim();
      }

      if (type === "Article") {
        postData.abstract = abstract.trim();
        postData.articleText = articleText.trim();
      }

      const postRef = await db
        .collection("posts")
        .add(postData);

      console.log("Post created:", postRef.id);

      return res.status(201).json({
        success: true,
        message: "Post published successfully!",
        postId: postRef.id,
      });
    } catch (error) {
      console.error("Post creation error:", error);

      return res.status(500).json({
        message: "Unable to publish your post.",
      });
    }
  }
);

app.get("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { type, plan, tag, from, to } = req.query;
    const userPlan = req.subscriptionPlan;

    if (type && !["Question", "Article"].includes(type)) {
      return res.status(400).json({
        message: "Invalid post type filter.",
      });
    }

    if (plan && !["free", "paid"].includes(plan)) {
      return res.status(400).json({
        message: "Invalid post plan filter.",
      });
    }

    if (tag && (typeof tag !== "string" || tag.trim().length > 30)) {
      return res.status(400).json({
        message: "Invalid tag filter.",
      });
    }

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (
      (from && Number.isNaN(fromDate.getTime())) ||
      (to && Number.isNaN(toDate.getTime()))
    ) {
      return res.status(400).json({
        message: "Invalid date filter.",
      });
    }

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({
        message: "Start date cannot be after end date.",
      });
    }

    const snapshot = await db
      .collection("posts")
      .get();

    let posts = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data(),
    }));

    // Restrict access before applying other filters.
    if (userPlan === "free") {
      posts = posts.filter(post => post.plan === "free");
    }

    if (type) {
      posts = posts.filter(post => post.type === type);
    }

    if (plan) {
      posts = posts.filter(post => post.plan === plan);
    }

    if (tag) {
      const searchTag = tag.trim().toLowerCase();

      posts = posts.filter(
        post =>
          Array.isArray(post.tags) &&
          post.tags.includes(searchTag)
      );
    }

    if (fromDate) {
      posts = posts.filter(post => {
        const date = post.createdAt?.toDate?.();
        return date && date >= fromDate;
      });
    }

    if (toDate) {
      posts = posts.filter(post => {
        const date = post.createdAt?.toDate?.();
        return date && date <= toDate;
      });
    }

    posts.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      createdAt: post.createdAt?.toDate
        ? post.createdAt.toDate().toISOString()
        : null,
    }));

    return res.status(200).json({
      success: true,
      userPlan,
      totalPosts: formattedPosts.length,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Browse posts error:", error);

    return res.status(500).json({
      message: "Unable to retrieve posts.",
    });
  }
});

app.post("/subscribe", async (req, res) => {
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      !process.env.SENDGRID_FROM_EMAIL
    ) {
      return res.status(503).json({
        message: "Newsletter service is not configured.",
      });
    }

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim()
        : "";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to DEV@Deakin!",
      text: "Thank you for subscribing to the DEV@Deakin Daily Insider!",
      html: `
        <h1>Welcome to DEV@Deakin!</h1>
        <p>Thank you for subscribing to our Daily Insider.</p>
        <p>We are excited to have you with us!</p>
      `,
    });

    return res.status(202).json({
      message: "Subscription successful! Check your inbox.",
    });
  } catch (error) {
    console.error(
      "SendGrid error:",
      error.response?.body || error.message
    );

    return res.status(500).json({
      message: "Unable to send the welcome email.",
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  console.error("Server error:", error.message);

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});