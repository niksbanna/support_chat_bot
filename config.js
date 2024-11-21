// config.js
require("dotenv").config();
const redis = require("redis");
const { HfInference } = require("@huggingface/inference");

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.connect().catch(console.error);

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

module.exports = { redisClient, hf };
