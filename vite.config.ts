import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { copyFileSync, readdirSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  base: '/fixed-reit-tracker/',
  plugins: [
    inspectAttr(),
    react(),
    {
      name: 'copy-data-folder',
      apply: 'build',
      async closeBundle() {
        try {
          const publicDataDir = path.resolve(__dirname, 'public/data')
          const distDataDir = path.resolve(__dirname, 'dist/data')
          
          // Copy the entire data folder from public to dist
          const copyRecursive = (src, dest) => {
            const files = readdirSync(src, { withFileTypes: true })
            
            // Create dest directory if it doesn't exist
            const fs = require('fs')
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true })
            }
            
            files.forEach(file => {
              const srcPath = path.join(src, file.name)
              const destPath = path.join(dest, file.name)
              
              if (file.isDirectory()) {
                copyRecursive(srcPath, destPath)
              } else {
                copyFileSync(srcPath, destPath)
              }
            })
          }
          
          copyRecursive(publicDataDir, distDataDir)
          console.log('✓ Data folder copied to dist/')
        } catch (err) {
          console.error('Error copying data folder:', err)
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
