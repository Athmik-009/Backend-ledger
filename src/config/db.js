const mongoose = require("mongoose")

async function connectToDB() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/backend-ledger"

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        })
        console.log("server is connected to DB")
    } catch (err) {
        console.warn("MongoDB connection failed, continuing without a database:", err.message)
    }
}

module.exports = connectToDB