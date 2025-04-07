const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;

const superadminRoutes = require("./routes/superAdminRoutes");
const schooladminRoutes = require("./routes/schoolAdminRoutes");
const staffRoutes = require("./routes/staffRoutes");

app.use(cors());
app.use(express.json());

// Import routes
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/s1/superadmin", superadminRoutes);
app.use("/api/s1/schooladmin", schooladminRoutes);
app.use("/api/s1/staff", staffRoutes);

// Add other routes similarly...

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}/api/s1/...`);
});
