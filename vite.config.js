import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
    host: true
  },
  plugins: [
    {
      name: 'save-sprite-endpoint',
      configureServer(server) {
        server.middlewares.use('/api/save-fish', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { filename, base64 } = JSON.parse(body);
                const data = base64.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(data, 'base64');

                // Save to both public/assets/fish and assets/fish
                const dirs = [
                  path.resolve(__dirname, 'public/assets/fish'),
                  path.resolve(__dirname, 'assets/fish')
                ];

                dirs.forEach(dir => {
                  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                  fs.writeFileSync(path.join(dir, filename), buffer);
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, saved: filename }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
