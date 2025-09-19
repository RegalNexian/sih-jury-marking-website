# Render Deployment Guide for SIH Jury Real-time System

## Overview
This guide explains how to deploy the SIH Jury Evaluation System with real-time synchronization to Render.

## Architecture
- **Frontend**: React app deployed on Vercel/Render
- **Backend**: Socket.IO server deployed on Render
- **Real-time sync**: WebSocket connections between all devices

## Deployment Steps

### 1. Socket.IO Server Deployment (Render)

1. **Create a new Web Service on Render**:
   - Connect your GitHub repository
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

2. **Environment Variables** (Add in Render dashboard):
   ```
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-app.vercel.app
   PORT=10000
   ```

3. **Your Render server URL will be**:
   ```
   https://your-socket-server.onrender.com
   ```

### 2. Frontend Deployment

#### Option A: Vercel
1. Connect your GitHub repository to Vercel
2. Set **Root Directory**: `/` (main folder)
3. **Build Command**: `npm run build`
4. **Environment Variables**:
   ```
   VITE_SOCKET_URL=https://your-socket-server.onrender.com
   ```

#### Option B: Render Static Site
1. Create a new Static Site on Render
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_SOCKET_URL=https://your-socket-server.onrender.com
   ```

### 3. Update Environment Configuration

1. **Update `.env.production`**:
   ```env
   VITE_SOCKET_URL=https://your-actual-socket-server.onrender.com
   ```

2. **Update Render environment variables** with your actual frontend URL:
   ```
   CLIENT_URL=https://your-actual-frontend.vercel.app
   ```

## Testing Real-time Functionality

1. **Open multiple browser tabs/devices** pointing to your deployed frontend
2. **Navigate to different jury pages** on different devices
3. **Save evaluations** on one device and verify they appear on others instantly
4. **Test admin functions** like reset and verify they sync across all devices

## Monitoring

- **Socket.IO Server Health**: `https://your-socket-server.onrender.com/api/health`
- **Connected Clients**: `https://your-socket-server.onrender.com/api/clients`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `CLIENT_URL` environment variable is set correctly in Render
2. **Connection Failed**: Check that `VITE_SOCKET_URL` points to your actual Render server
3. **Real-time not working**: Verify both frontend and backend are deployed and running

### Debug Steps:

1. Check browser console for Socket.IO connection errors
2. Monitor Render logs for server errors
3. Verify environment variables are set correctly
4. Test the health endpoint: `/api/health`

## Security Notes

- CORS is configured for your specific domains
- Admin actions require proper authentication
- WebSocket connections are secured in production

## Performance

- The system supports up to 100 concurrent jury connections
- Auto-reconnection handles temporary network issues
- Data persistence uses localStorage with real-time sync backup

## Support

For deployment issues:
1. Check Render build logs
2. Verify all environment variables
3. Test local development setup first
4. Monitor network connectivity between services