import mongoose from "mongoose";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI as string;

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production") {
      throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise && MONGODB_URI) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    if(cached.promise) {
      cached.conn = await cached.promise;
      console.log("MongoDB Connected Successfully");
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
