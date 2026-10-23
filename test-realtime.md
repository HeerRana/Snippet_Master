# Real-Time Testing Guide

## 🧪 Testing Live Snippet Updates

### Prerequisites
1. Backend server running on port 8000
2. Frontend running on port 3000
3. MongoDB connected
4. OpenAI API key configured (for AI features)

### Test Steps

#### 1. Basic Real-Time Test
```bash
# Terminal 1 - Start backend
cd backend
npm install
npm start

# Terminal 2 - Start frontend  
cd client
npm install
npm run dev
```

#### 2. Multi-Tab Testing
1. **Open multiple browser tabs** to `http://localhost:3000`
2. **Login** in all tabs (same or different accounts)
3. **Create a snippet** in one tab
4. **Watch** the snippet appear instantly in other tabs
5. **Check** the "Live" indicator in the header

#### 3. Connection Status Test
- **Online**: Green dot + "Live" text
- **Offline**: Red dot + "Offline" text
- **Reconnection**: Should automatically reconnect

#### 4. AI Analysis Test
1. **Visit** any snippet detail page (`/snippet/[id]`)
2. **Click** "Analyze Code" button
3. **Wait** for AI analysis to complete
4. **Review** the analysis results

### Expected Behavior

#### ✅ Real-Time Updates
- New snippets appear at the top of the list
- Toast notification shows "New snippet: [title]"
- No page refresh required
- Works across all connected users

#### ✅ Connection Status
- Shows "Live" when connected
- Shows "Offline" when disconnected
- Automatically reconnects

#### ✅ AI Features
- Code analysis provides quality score
- Suggests improvements
- Generates documentation
- Requires authentication

### Troubleshooting

#### Real-Time Not Working?
1. Check browser console for Socket.IO errors
2. Verify backend server is running
3. Check CORS configuration
4. Ensure WebSocket connections are allowed

#### AI Features Not Working?
1. Verify OpenAI API key is set
2. Check authentication (must be logged in)
3. Review network requests in browser dev tools
4. Check backend logs for errors

### Performance Notes
- Real-time updates are instant (< 100ms)
- AI analysis takes 2-5 seconds
- WebSocket connection is persistent
- Automatic reconnection on network issues 