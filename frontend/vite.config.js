import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { ClickToComponent } from 'vite-plugin-react-click-to-component'
// import { reactClickToComponent } from "vite-plugin-react-click-to-component";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
