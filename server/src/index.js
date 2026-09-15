import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/databaseConfig.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`MongoDB Connection Error: ${err}`);
    process.exit(1);
  });
