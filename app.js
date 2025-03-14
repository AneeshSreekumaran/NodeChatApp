const express = require('express');
const session = require('express-session');
const { create } = require('connect-mongo'); // Import create
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const { isLoggedIn } = require('./middleware/authMiddleware');
const connectDB = require('./config/database');
require('dotenv').config();
const User = require('./models/User');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Session configuration
const sessionStore = create({  // Call create() to get the store instance
    mongoUrl: process.env.MONGODB_URI,  // Use mongoUrl instead of mongooseConnection
    mongooseConnection: mongoose.connection,
    collectionName: 'sessions' //Optional, you can specify the collection name
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // Use the store instance directly
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
}));

// Express middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.use(authRoutes);
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);

app.get('/', isLoggedIn, (req, res) => {
    res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
    res.render('auth/login', { error: null });
});

app.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});



app.get('/dashboard', isLoggedIn, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.redirect('/login'); // Handle user not found
      }
  
      res.render('dashboard', { username: user.username }); // Pass username instead of userId
    } catch (error) {
      console.error('Error fetching user for dashboard:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

app.get('/settings', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      // Handle the case where the user is not found (e.g., redirect to login)
      return res.redirect('/login');
    }

    res.render('settings', { user: user }); // Pass the user object to the view
  } catch (error) {
    console.error('Error fetching user for settings:', error);
    // Handle the error (e.g., display an error message to the user)
    res.status(500).send('Internal Server Error');
  }
});

const server = http.createServer(app);
const io = socketIO(server);

app.use(function (req, res, next) {
    req.app.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});