# InstaMART AI Agent

An AI-powered shopping assistant that searches, scrapes, and matches products on InstaMART. The system utilizes Google Gemini, Model Context Protocol (MCP), and Playwright to find real-time product information, prices, and availability, presenting it in a modern, responsive React-based interface.

---

## 🚀 Features

- **Intelligent Search:** Processes natural language queries using an LLM-powered agent to find relevant products.
- **Location-Aware:** Automatically detects the user's location via the browser's geolocation API, with a manual city selector fallback.
- **Automated Web Automation:** Leverages Playwright to scrape product details dynamically.
- **Caching:** Integrates Redis to store and retrieve query results for faster subsequent loads.
- **Modern UI:** Built with React and Lucide Icons, featuring beautiful card designs and skeleton loading states.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Lucide Icons, Vanilla CSS
- **Backend:** FastAPI (Python), LangChain, Google Gemini API, Playwright, MCP
- **Caching:** Redis
- **Containerization:** Docker & Docker Compose

---

## 🚦 Quick Start (Docker)

The fastest way to get the entire environment running is with Docker Compose:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aarti-04/shoppingAI-agent.git
   cd instamartAI-agent
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:8001/health](http://localhost:8001/health)

---

## 💻 Local Development Setup

To run the services individually without Docker:

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Install Playwright browsers:
   ```bash
   playwright install
   ```
5. Run the FastAPI application:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
