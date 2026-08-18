'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const auth = require('./middleware/auth');
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const changePasswordRoute = require('./routes/changepassword');
const interviewsRoute = require('./routes/interviews');
const transcribeRoute = require('./routes/transcribe');
const { seedQuestionBank } = require('./utils/vectorStore');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8000;
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/changepassword', changePasswordRoute);
app.use('/interviews', auth, interviewsRoute);
app.use('/transcribe', auth, transcribeRoute);

function createMockDb() {
  const store = { users: [], interviews: [] };
  const getCollection = (name) => {
    if (!store[name]) store[name] = [];
    const list = store[name];

    const findOne = async (query, options) => {
      const match = list.find(item => {
        for (let k in query) {
          if (query[k] instanceof ObjectId || item[k] instanceof ObjectId) {
            if ((query[k]?.toString() || '') !== (item[k]?.toString() || '')) return false;
          } else if (query[k] !== item[k]) return false;
        }
        return true;
      });
      if (!match) return null;
      if (options?.projection) {
        const projected = { ...match };
        for (let k in options.projection) { if (options.projection[k] === 0) delete projected[k]; }
        return projected;
      }
      return match;
    };

    const insertOne = async (doc) => {
      const newDoc = { _id: new ObjectId(), ...doc };
      list.push(newDoc);
      return { acknowledged: true, insertedId: newDoc._id };
    };

    const updateOne = async (query, update) => {
      const item = await findOne(query);
      if (item && update.$set) Object.assign(item, update.$set);
      return { acknowledged: true, modifiedCount: item ? 1 : 0 };
    };

    const find = (query) => {
      let results = list.filter(item => {
        for (let k in query) {
          if (query[k] instanceof ObjectId || item[k] instanceof ObjectId) {
            if ((query[k]?.toString() || '') !== (item[k]?.toString() || '')) return false;
          } else if (query[k] !== item[k]) return false;
        }
        return true;
      });
      const chain = {
        project: (proj) => {
          results = results.map(item => {
            const p = { ...item };
            for (let k in proj) { if (proj[k] === 0) delete p[k]; }
            return p;
          });
          return chain;
        },
        sort: (spec) => {
          const key = Object.keys(spec)[0];
          const dir = spec[key];
          results.sort((a, b) => (a[key] < b[key] ? dir : a[key] > b[key] ? -dir : 0));
          return chain;
        },
        toArray: async () => results
      };
      return chain;
    };

    return { findOne, insertOne, updateOne, find };
  };

  return { collection: getCollection };
}

async function startServer() {
  try {
    seedQuestionBank();
    logger.info('vector_store_ready', { message: 'Question bank loaded' });
  } catch (err) {}

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    global.db = client.db('HireSim');
    console.log('[HireSim] Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('[HireSim] MongoDB unavailable, using in-memory DB:', err.message);
    global.db = createMockDb();
  }

  if (!IS_VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[HireSim] Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
module.exports = app;