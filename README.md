# NexArena - Smart Venue AI Assistant

## Vertical: Physical Event Experience

## Problem
Large-scale sporting venue attendees face crowd navigation 
issues, long wait times, and lack of real-time information.

## Solution
AI-powered venue assistant using Gemini API that helps 
attendees navigate stadiums in real-time.

## How it works
1. Fan opens NexArena on their phone
2. Asks Arena AI questions in natural language
3. Gemini API processes with venue context
4. Real-time crowd density shown on interactive map
5. Admin dashboard updates zone density via Firestore

## Google Services Used
- Gemini API: Core AI chat processing
- Firebase Firestore: Real-time zone data
- Firebase Auth: Google Sign-In
- Google Cloud Run: Deployment

## Tech Stack
Next.js 14, TypeScript, Tailwind CSS, Firebase, Gemini API

## Live Demo
https://nexarena-965928495929.asia-south1.run.app/

## Assumptions
- Venue zone data is simulated via admin dashboard
- Queue times are estimated based on density levels
