/*
 * Development only (`npm start`): serve the /api functions from this dev server,
 * so the admin works locally without `vercel dev`. Create React App loads .env.local
 * into process.env first, so ADMIN_USERNAME / ADMIN_PASSWORD come from there.
 * On Vercel these files are deployed as serverless functions instead.
 */
const path = require('path');
const { pathToFileURL } = require('url');
const express = require('express');

const ROUTES = ['content', 'login', 'logout', 'me', 'upload', 'media'];

module.exports = function setupApi(app) {
  app.use('/api', express.json({ limit: '4mb' }));
  ROUTES.forEach((name) => {
    app.all(`/api/${name}`, async (req, res) => {
      try {
        const file = pathToFileURL(path.join(__dirname, '..', 'api', `${name}.js`)).href;
        const { default: handler } = await import(file);
        await handler(req, res);
      } catch (error) {
        console.error(`[api/${name}]`, error);
        if (!res.headersSent) res.status(500).json({ error: error.message || 'Server error' });
      }
    });
  });
};
