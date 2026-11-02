
const dotenv = require("dotenv");
const path = require("path");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

dotenv.config({ path: path.join(__dirname, ".env") });

async function testFirebase() {
  try {
    const serviceAccount = require("./service-account.json");

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    const db = getFirestore(app);

    console.log("Connecting to Firebase...");

    const snapshot = await db.collection("users").limit(1).get();

    console.log("================================");
    console.log("Firebase connection successful!");
    console.log("Project:", process.env.FIREBASE_PROJECT_ID);
    console.log("Firestore accessible:", true);
    console.log("User documents found:", snapshot.size);
    console.log("================================");

    await app.delete();
  } catch (error) {
    console.error("Firebase connection failed:", error.message);
    process.exitCode = 1;
  }
}

testFirebase();
