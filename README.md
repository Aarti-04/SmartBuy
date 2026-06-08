# SmartBuy 🛒

SmartBuy is an AI-powered shopping assistant that helps users find the best deals across quick-commerce platforms by searching, scraping, matching, and comparing products in real time.

The platform currently supports **Swiggy Instamart**, with integrations for **Zepto**, **Blinkit**, and other grocery delivery platforms is under development.

---

## ✨ Overview

Finding the best price for a product often requires checking multiple shopping platforms manually. SmartBuy automates this process using AI agents and browser automation.

Users can search for products using natural language, and SmartBuy will:

* Search for relevant products
* Extract real-time product information
* Match similar products across platforms
* Compare prices
* Recommend the most cost-effective platform for purchase

---

## 🏗️ Architecture

SmartBuy follows a modular, agent-driven architecture that separates AI reasoning from web automation, making the system scalable and easy to extend.

### AI Agent Layer

* Built using **LangChain** and **FastMCP**
* Powered by **Google Gemini**
* Handles user queries, product matching, reasoning, and tool execution
* Supports structured tool-calling workflows

### Model Context Protocol (MCP)

* Uses **Model Context Protocol (MCP)** to decouple the LLM from browser automation
* A custom MCP server exposes browser actions as tools
* Enables easy integration of new tools and platforms

### Web Automation

* Built with **Playwright**
* Uses **playwright-stealth** to handle anti-bot protections
* Dynamically navigates shopping websites and extracts live product data

### Caching Layer

* Uses **Redis** for temporary caching
* Stores scraped product results to reduce redundant browser executions
* Improves response time and overall performance

---

## 🚀 Features

- **AI-Powered Product Search:** Search for products using natural language queries.

- **Real-Time Price Comparison:** Compare prices across supported quick-commerce platforms.

- **Intelligent Product Matching:** Uses AI reasoning to identify equivalent products from different sources.

- **Location-Aware Search:** Detects the user's location automatically with browser geolocation support.

- **Automated Data Extraction:** Fetches live product details directly from shopping platforms using Playwright.

- **Redis Caching:** Reduces latency by caching previously scraped product information.

- **Modern User Interface:** Responsive React-based UI with clean product cards and loading states.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Lucide Icons
* Vanilla CSS

### Backend

* FastAPI
* LangChain
* FastMCP
* Google Gemini
* Playwright
* Playwright Stealth

### Infrastructure

* Redis
* Docker
* Docker Compose

---

## Quick Start (Docker)

### Clone the Repository

```bash
git clone https://github.com/Aarti-04/SmartBuy.git
cd SmartBuy
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Start the Application

```bash
docker-compose up --build
```

### Access the Services

Frontend:

```text
http://localhost:5173
```

Backend Health Check:

```text
http://localhost:8000/health
```

---

## 💻 Local Development

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Install Playwright browsers:

```bash
playwright install
```

Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

---

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## 🔮 Future Enhancements

* Blinkit integration
* Zepto integration
* Persistent database support
* Price history tracking
* Product availability monitoring
* Price drop alerts
---

## 🤝 Contributing

Contributions, feature requests, and suggestions are welcome.

Feel free to open an issue or submit a pull request.

---