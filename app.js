const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const MongoDbStore = require("connect-mongodb-session")(session);

const authRoutes = require("./routes/auth");
const trialRoutes = require("./trial");
const publicationRoute = require("./routes/pub");
const expertRoute = require("./routes/experts");
const postRoute = require("./routes/post");

const app = express();

// --------------------------
//  MONGODB URI
// --------------------------
const MONGODB_URI =
  "mongodb+srv://priyan18:uW153jr24jFAJcwz@cluster0.j0yybjj.mongodb.net/curalink";

// --------------------------
//  SESSION STORE
// --------------------------
const store = new MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// --------------------------
//  MIDDLEWARE
// --------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

// --------------------------
//  EXPRESS SESSION
// --------------------------
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    },
  })
);

// --------------------------
//  API ROUTES (backend)
// --------------------------
app.use(trialRoutes);
app.use("/user", authRoutes);
app.use(publicationRoute);
app.use(expertRoute);
app.use("/forum", postRoute);

// --------------------------
//  SERVE FRONTEND DIST (IMPORTANT)
// --------------------------

// Path to dist folder inside backend/frontend/dist
const distPath = path.join(__dirname, "frontend", "dist");

// Serve static files (index.html, assets)
app.use(express.static(distPath));

// Fallback: send index.html for ANY other route
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// --------------------------
//  START SERVER AFTER MONGO CONNECTS
// --------------------------
const PORT = process.env.PORT || 3000;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected.");
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

// --------------------------
//  ERROR HANDLING
// --------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});
