import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.MONGO_DB;
const SESSION_SECRET = process.env.SESSION_SECRET;

// MongoDB connection
let db;
let Users;
let Contents;
let Follows;

async function connectMongo() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  Users = db.collection('users');
  Contents = db.collection('contents');
  Follows = db.collection('follows');

  await Users.createIndex({ username: 1 }, { unique:  true });
  await Follows.createIndex({ follower: 1, following: 1 }, { unique: true });

  console.log('Connected to MongoDB, db:', DB_NAME);
}

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave:  false,
    saveUninitialized: false,
    cookie:  {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads directory
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Auth middleware
function requireLogin(req, res, next) {
  if (! req.session.user) {
    return res.status(401).json({ ok: false, error: 'Not logged in' });
  }
  next();
}

// ===== USER ROUTES =====

app.post('/M01010322/users', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error:  'username and password are required' });
    }
    const userDoc = {
      username:  String(username).trim(),
      password: String(password),
      createdAt: new Date()
    };
    const result = await Users.insertOne(userDoc);
    return res.status(201).json({
      ok: true,
      message: 'User created successfully',
      userId: result.insertedId.toString()
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, error: 'username already exists' });
    }
    console.error('Error in POST /users', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/M01010322/users', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ ok: true, results: [] });
    
    const regex = new RegExp(q. replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await Users.find({ username: regex })
      .project({ password: 0 })
      .limit(50)
      .toArray();
    return res.json({ ok: true, results: users });
  } catch (err) {
    console.error('Error in GET /users', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ===== LOGIN ROUTES =====

app.get('/M01010322/login', (req, res) => {
  if (! req.session.user) {
    return res.json({ ok: true, loggedIn: false });
  }
  return res.json({
    ok: true,
    loggedIn: true,
    user: { username: req.session.user.username }
  });
});

app.post('/M01010322/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'username and password are required' });
    }
    const user = await Users.findOne({ username: String(username).trim() });
    if (!user || user.password !== String(password)) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
    req.session.user = { id: user._id.toString(), username: user.username };
    return res.json({ ok: true, message: 'Login successful' });
  } catch (err) {
    console.error('Error in POST /login', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.delete('/M01010322/login', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.json({ ok: true, message: 'Logged out' });
  });
});

// ===== CONTENT & UPLOAD ROUTES =====

app.post('/M01010322/contents', requireLogin, async (req, res) => {
  try {
    const { content, imageUrl } = req.body || {};
    if (!content || ! String(content).trim()) {
      return res.status(400).json({ ok: false, error: 'content is required' });
    }
    const post = {
      userId: req.session.user.id,
      username: req.session.user.username,
      content: String(content).trim(),
      imageUrl: imageUrl || null,
      createdAt: new Date()
    };
    const result = await Contents.insertOne(post);
    return res.status(201).json({ ok: true, message: 'Post created', postId: result.insertedId.toString() });
  } catch (err) {
    console.error('Error in POST /contents', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.post('/M01010322/upload', requireLogin, async (req, res) => {
  try {
    const { filename, data, caption } = req.body;
    
    if (!filename || !data) {
      return res.status(400).json({ ok: false, error: 'filename and data required' });
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const cleanName = filename.replace(/\s+/g, '_');
    const uniqueName = Date.now() + '-' + cleanName;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    const post = {
      userId: req.session.user.id,
      username: req.session.user.username,
      content: caption || '📸 Shared a photo',  
      imageUrl: fileUrl,
      createdAt: new Date()
    };
    await Contents.insertOne(post);
    
    return res.json({ ok: true, message: 'File uploaded and posted to feed', url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

app.get('/M01010322/contents', async (req, res) => {
  try {
    const { username } = req.query;
    const filter = username ? { username:  String(username).trim() } : {};
    const posts = await Contents.find(filter).sort({ createdAt: -1 }).limit(100).toArray();
    return res.json({ ok: true, posts });
  } catch (err) {
    console.error('Error in GET /contents', err);
    return res.status(500).json({ ok: false, error:  'Server error' });
  }
});

// ===== FOLLOW ROUTES =====

app.post('/M01010322/follow', requireLogin, async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ ok: false, error: 'username is required' });

    const targetUser = await Users.findOne({ username: String(username).trim() });
    if (!targetUser) return res.status(404).json({ ok: false, error: 'User not found' });

    if (targetUser.username === req.session.user.username) {
      return res.status(400).json({ ok: false, error: 'Cannot follow yourself' });
    }
    const followDoc = {
      follower: req.session.user.username,
      following: targetUser.username,
      createdAt: new Date()
    };
    await Follows.insertOne(followDoc);
    return res.status(201).json({ ok: true, message: `Now following ${targetUser.username}` });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ ok: false, error: 'Already following' });
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.delete('/M01010322/follow', requireLogin, async (req, res) => {
  try {
    const { username } = req.body || {};
    const result = await Follows.deleteOne({
      follower: req.session.user.username,
      following: String(username).trim()
    });
    if (result.deletedCount === 0) return res.status(404).json({ ok: false, error: 'Not following' });
    return res.json({ ok: true, message: `Unfollowed ${username}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/M01010322/follow', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ ok: false, error: 'username required' });
    const followers = await Follows.find({ following: username }).toArray();
    const following = await Follows.find({ follower: username }).toArray();
    return res.json({
      ok: true,
      followers: followers.map(f => f.follower),
      following: following.map(f => f.following)
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/M01010322/feed', requireLogin, async (req, res) => {
  try {
    const following = await Follows.find({ follower: req.session.user.username }).toArray();
    const followingUsernames = following.map(f => f.following);
    followingUsernames.push(req.session.user.username);

    const posts = await Contents.find({ username: { $in: followingUsernames } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return res.json({ ok: true, posts });
  } catch (err) {
    return res.status(500).json({ ok: false, error:  'Server error' });
  }
});

// ===== MATCHES ROUTE =====
app.get('/M01010322/matches', async (req, res) => {
  try {
    const API_KEY = 'f0e1a10ec4f446c28eb16b8d3a784a0f';

    console.log('Fetching matches from football-data. org...');

    const response = await fetch('https://api.football-data.org/v4/teams/86/matches?limit=5', {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Football API error:', response.status, errorText);
      throw new Error(`API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.matches?.length || 0} matches`);

    res.json({
      ok: true,
      matches: data.matches || []
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch match data',
      matches: []
    });
  }
});

// ===== TEAM/SQUAD ROUTE =====
app.get('/M01010322/team', async (req, res) => {
  try {
    const API_KEY = 'f0e1a10ec4f446c28eb16b8d3a784a0f';

    console.log('Fetching Real Madrid squad from football-data.org...');

    const response = await fetch('https://api.football-data.org/v4/teams/86', {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response. text();
      console.error('Football API error:', response.status, errorText);
      throw new Error(`API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched squad with ${data.squad?.length || 0} players`);

    res.json({
      ok: true,
      squad: data.squad || [],
      coach: data. coach || null
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch team data',
      squad: []
    });
  }
});

// ===== NEWS ROUTE =====
app.get('/M01010322/news', async (req, res) => {
  try {
    const NEWS_API_KEY = 'b715f2be509a4950824b9e64f4f94343';

    console.log('Fetching Real Madrid news...');

    const response = await fetch(`https://newsapi.org/v2/everything?q=Real+Madrid&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('News API error:', response.status, errorText);
      throw new Error(`API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.articles?.length || 0} news articles`);

    res.json({
      ok: true,
      articles: data.articles || []
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch news',
      articles: []
    });
  }
});

// Start server
connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});