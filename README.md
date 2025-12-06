
# The System: Villain Arc

A gamified life and fitness tracker inspired by "Solo Leveling".

## 🚀 How to Deploy

You can host this for free on Vercel, Render, or Netlify.

### Option 1: Vercel (Recommended - Easiest)
1. Push this code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and sign up/login.
3. Click "Add New" > "Project".
4. Import your GitHub repository.
5. **Important**: Add your API Key.
   - In the "Environment Variables" section, add `API_KEY` and paste your Google Gemini API key.
6. Click "Deploy".

### Option 2: Render
1. Push this code to a GitHub repository.
2. Go to [Render.com](https://render.com).
3. Click "New +" and select "Static Site".
4. Connect your repository.
5. Use these settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
6. Under "Environment Variables", add `API_KEY`.
7. Click "Create Static Site".

## 🛠 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file and add your API Key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
