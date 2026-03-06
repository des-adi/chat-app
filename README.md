# 💬 LesChat – Real-Time Chat Application

A full-stack real-time chat application built on the MERN stack with Socket.io for bi-directional communication. Features instant messaging, image sharing, unseen message tracking, profile management, and live online/offline user presence.

**🔗 Live Demo:** https://chat-app-twdl.onrender.com

**🐙 GitHub:** https://github.com/des-adi/chat-app

---

## 🚀 Features

- **Real-time messaging** — instant bi-directional communication using Socket.io WebSockets
- **Image sharing** — send images directly in chat, stored and served via Cloudinary
- **Unseen message tracking** — live badge counters showing unread message count per user
- **Online/Offline presence** — real-time user status indicators across all connected clients
- **Profile management** — update profile picture via Cloudinary upload
- **JWT Authentication** — secure login and registration with JSON Web Tokens stored in localStorage
- **Auto message marking** — messages marked as seen automatically when conversation is opened

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React.js, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| Authentication | JWT, bcryptjs |
| Media Storage | Cloudinary |
| State Management | React Context API |
| Deployment | Render |

---

## ⚙️ How It Works

### Real-Time Messaging

When a user sends a message, the backend saves it to MongoDB and simultaneously emits it to the recipient's socket using their socketId looked up from an in-memory map:

```javascript
// Server — emit to recipient directly
const receiverSocketId = userSocketMap[receiverId];
if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
}
```

On the client side, ChatContext subscribes to incoming socket events and updates message state in real time. If the sender is the currently open conversation, the message is added directly. Otherwise the unseen counter for that sender is incremented:

```javascript
socket.on("newMessage", (newMessage) => {
    if (selectedUser && newMessage.senderId === selectedUser._id) {
        setMessages((prev) => [...prev, newMessage]);
    } else {
        setUnseenMessages((prev) => ({
            ...prev,
            [newMessage.senderId]: prev[newMessage.senderId] 
                ? prev[newMessage.senderId] + 1 : 1
        }));
    }
});
```

### Online Presence

When a user connects via Socket.io, their userId is mapped to their socketId in an in-memory object on the server. This map is broadcast to all clients on every connect and disconnect so the UI reflects live status instantly:

```javascript
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});
```

### Authentication Flow

JWT token is stored in localStorage on login and set as the default Authorization header for all axios requests. On every app load, checkAuth verifies the token against the backend — invalid or missing tokens are cleared and the user is redirected to login:

```javascript
const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) { handleInvalidToken(); return; }
    const { data } = await axios.get("/api/auth/check", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
    } else {
        handleInvalidToken();
    }
};
```

### Image Sharing

Images are base64 encoded on the client and sent to the backend where they are uploaded to Cloudinary. The returned secure URL is stored in MongoDB alongside the message text:

```javascript
if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageURL = uploadResponse.secure_url;
}
```

---

## 🏃 Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

```bash
cd server
npm install
```

Create `.env` in server folder:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

```bash
npm start
```

### Frontend Setup

```bash
cd client
npm install
```

Create `.env` in client folder:
```
VITE_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:5173

---

## 📂 Project Structure

```
chat-app/
├── server/
│   ├── server.js                  # Entry point, Socket.io setup
│   ├── controllers/
│   │   ├── messageController.js   # Messaging logic, Cloudinary upload
│   │   └── userController.js      # Auth, profile update
│   ├── models/
│   │   ├── Message.js             # Message schema
│   │   └── User.js                # User schema
│   ├── routes/
│   │   ├── messageRoutes.js       # Message endpoints
│   │   └── userRoutes.js          # Auth endpoints
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   └── lib/
│       ├── db.js                  # MongoDB connection
│       ├── cloudinary.js          # Cloudinary config
│       └── utils.js               # Helper functions
└── client/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx    # Auth state, socket connection, JWT
        │   └── ChatContext.jsx    # Messages, users, unseen tracking
        ├── components/
        │   ├── ChatContainer.jsx  # Message display and input
        │   ├── Sidebar.jsx        # User list with unseen counters
        │   └── RightSidebar.jsx   # Selected user info
        └── pages/
            ├── HomePage.jsx       # Main chat layout
            ├── LoginPage.jsx      # Login and register
            └── ProfilePage.jsx    # Profile update
```

---

## 🚀 Deployment

- Backend and frontend deployed together on **Render** as a single Web Service
- React is built via Vite and served as static files from the Express server in production
- MongoDB hosted on **MongoDB Atlas**
- Media stored on **Cloudinary**

---

## 👤 Author

**Aditya Deshmukh**
- GitHub: [@des-adi](https://github.com/des-adi)
- LinkedIn: [Aditya Deshmukh](https://linkedin.com/in/aditya-deshmukh)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
