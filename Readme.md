Youtube Backend

A scalable and production-ready **YouTube backend** built with **Node.js, Express, MongoDB**, and **Cloudinary** for media management.

## 🚀 Features

- **User Authentication**: Secure login/signup with JWT authentication & bcrypt password hashing.
- **Video Upload & Management**: Upload, delete, and manage videos using **Multer & Cloudinary**.
- **Comments & Playlists**: Add, delete, and organize videos into playlists.
- **Pagination & Filtering**: Efficient **Mongoose Aggregate Pagination** for videos and comments.
- **Secure Cookies & CORS**: Implemented **Cookie-Parser & CORS** for safe & smooth API access.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT & Bcrypt
- **File Uploads**: Multer & Cloudinary
- **Security**: Cookie-Parser, CORS
- **Pagination**: Mongoose Aggregate Paginate V2

## 📦 Installation & Usage

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/03chaibackend.git
   cd 03chaibackend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Run the backend in development mode:
   ```sh
   npm run dev
   ```

## 📌 API Endpoints

### **Authentication**
- `POST /api/auth/signup` → User signup
- `POST /api/auth/login` → User login

### **Video Management**
- `POST /api/videos/upload` → Upload a video
- `GET /api/videos/:id` → Get video details
- `DELETE /api/videos/:id` → Delete a video

### **Comments & Playlists**
- `POST /api/comments/:videoId` → Add comment
- `DELETE /api/comments/:commentId` → Delete comment
- `POST /api/playlists` → Create a playlist
- `POST /api/playlists/:playlistId/add` → Add video to playlist
- `DELETE /api/playlists/:playlistId/remove/:videoId` → Remove video from playlist

## 🏗️ Project Structure

```
📦 03ChaiBackend
├── 📂 src
│   ├── 📂 controllers  # Route logic
│   ├── 📂 models       # Mongoose models
│   ├── 📂 routes       # API endpoints
│   ├── 📂 middlewares  # Auth & validation middleware
│   ├── 📂 config       # Cloudinary, DB connections
│   ├── index.js        # Entry point
├── .env.example       # Environment variable template
├── package.json       # Dependencies & scripts
└── README.md          # Documentation
```

## ✅ Best Practices Followed

- **Modular Codebase**: Clean and organized structure.
- **Scalable Authentication**: Secure JWT-based login.
- **Production-Ready Code**: Optimized for real-world use.
- **Easily Switchable Storage**: Can replace Cloudinary with any other media service.

## 🎯 Future Enhancements

- **Live Streaming Integration**
- **AI-Based Video Recommendations**
- **Advanced Search & Filters**

## 👨‍💻 Author

**Aditya Singh**

## ⭐ Contribute

If you'd like to contribute, feel free to fork the repo and submit a PR!

## 📜 License

This project is **ISC Licensed**. Feel free to use and modify as needed!

