# Simchas Gourmet

A custom salad ordering application with Square payment integration.

## Features

- Custom salad builder with toppings, dressings, and proteins
- Square payment integration
- Delivery address collection
- Special requests handling

## Deployment to Netlify

This application is configured for easy deployment to Netlify. Follow these steps to deploy:

### Option 1: Deploy via Netlify CLI

1. Install the Netlify CLI globally:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize your site (from the project root):
   ```
   netlify init
   ```

4. Deploy your site:
   ```
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify UI

1. Create a new site from Git in the Netlify UI
2. Connect to your GitHub/GitLab/Bitbucket repository
3. Configure the build settings:
   - Build command: `npm run netlify:build`
   - Publish directory: `dist`
4. Add the following environment variables in the Netlify UI:
   - `VITE_SQUARE_ACCESS_TOKEN`: Your Square access token
   - `VITE_SQUARE_APPLICATION_ID`: Your Square application ID

## Environment Variables

The following environment variables need to be set in your Netlify project:

- `VITE_SQUARE_ACCESS_TOKEN`: Your Square access token
- `VITE_SQUARE_APPLICATION_ID`: Your Square application ID

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. The application will be available at http://localhost:5173

## Square Integration

This application uses the Square API for payment processing with the following configuration:

- Production API URL: https://connect.squareup.com/v2
- Location ID: L987EZA5K8RHY
- Tipping is disabled
- Delivery address collection is enabled
- Special requests are included in the item name for visibility
