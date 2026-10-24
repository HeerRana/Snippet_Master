import mongoose from "mongoose";

const connect = async () => {
  try {
    console.log("Attempting to connect to database.....");
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI or MONGODB_URI environment variable is missing.");
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to database.....");
  } catch (error) {
    console.log("Failed to connect to database.....", error.message);
    process.exit(1);
  }
};

export default connect;
