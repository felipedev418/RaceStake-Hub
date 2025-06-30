# Backend Deployment Guide

## Option 1: Deploy Backend on Railway/Render
1. Create new repository with just the backend folder
2. Deploy on Railway.app or Render.com
3. Update frontend to call the deployed backend URL

## Option 2: Use Vercel for both (with API routes)
1. Convert Express routes to Next.js API routes
2. Keep all code in one repository
3. Deploy as single Next.js application

## Option 3: Use Docker (if needed)
1. Create Dockerfile for backend
2. Deploy on any container platform
3. Frontend stays on Vercel

Choose Option 1 (API routes) for simplicity with Vercel.
