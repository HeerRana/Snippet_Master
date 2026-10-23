# Cloudinary Setup Guide

## 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Get your credentials from the dashboard

## 2. Add Environment Variables
Add these to your `.env` file in the backend directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 3. Get Your Credentials
1. Login to Cloudinary Dashboard
2. Go to "Dashboard" → "API Environment variable"
3. Copy the values:
   - Cloud Name
   - API Key
   - API Secret

## 4. Features
- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Auto Optimization**: Images are automatically resized to 400x400
- **Face Detection**: Images are cropped to focus on faces
- **Quality Optimization**: Automatic quality adjustment
- **CDN**: Fast global delivery

## 5. Folder Structure
All profile images will be stored in the `snippy-profiles` folder in your Cloudinary account. 