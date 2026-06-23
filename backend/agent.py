# agent.py
import os
import sys
import logging
import asyncio
from contextlib import AsyncExitStack

from dotenv import load_dotenv
load_dotenv()

from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain.agents import create_agent

# Configure logging
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are SmartBuy, a helpful grocery shopping assistant.
When a user searches for a product, call the search_all_platforms tool ONCE with the query and city. It already returns all three platform sections (**INSTAMART:**, **ZEPTO:**, **BLINKIT:**) pre-formatted. Do not call search_instamart, search_zepto, or search_blinkit individually — always use search_all_platforms. Return its output to the user with minimal modification, preserving the exact section headers and product list formatting it provides.
Answer the user's request based on the tool execution output."""

# Fallback Gemini models as requested by the user
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini"]

class MCPClientManager:
    def __init__(self, server_params: StdioServerParameters):
        self.server_params = server_params
        self.exit_stack = None
        self.session = None
        self.tools = None
        self._lock = asyncio.Lock()

    async def start(self):
        async with self._lock:
            if self.session is not None:
                return
            
            logger.info("Initializing persistent MCP client...")
            self.exit_stack = AsyncExitStack()
            try:
                # Enter stdio_client context
                read, write = await self.exit_stack.enter_async_context(
                    stdio_client(self.server_params)
                )
                # Enter ClientSession context
                self.session = await self.exit_stack.enter_async_context(
                    ClientSession(read, write)
                )
                # Initialize session
                await self.session.initialize()
                logger.info("MCP client session initialized.")
                
                # Load tools
                self.tools = await load_mcp_tools(self.session)
                logger.info(f"Loaded {len(self.tools)} tools from persistent MCP session.")
            except Exception as e:
                logger.error(f"Failed to start persistent MCP client: {e}")
                await self.stop()
                raise e

    async def get_tools_and_session(self):
        if self.session is None:
            await self.start()
        return self.tools, self.session

    async def stop(self):
        async with self._lock:
            if self.exit_stack:
                logger.info("Stopping persistent MCP client...")
                await self.exit_stack.aclose()
                self.exit_stack = None
            self.session = None
            self.tools = None
            logger.info("Persistent MCP client stopped.")

_mcp_manager = None

def get_mcp_manager() -> MCPClientManager:
    global _mcp_manager
    if _mcp_manager is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        mcp_server_path = os.path.join(current_dir, "mcp_server.py")
        server_params = StdioServerParameters(
            command=sys.executable,
            args=[mcp_server_path],
            env=os.environ.copy()
        )
        _mcp_manager = MCPClientManager(server_params)
    return _mcp_manager

async def run_agent(query: str) -> str:
    """
    Runs the LangChain agent using the persistent MCP client session.
    Iterates through models in fallback order if there are issues executing the LLM.
    """
    llm_provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    if llm_provider == "gemini":
        models_to_try = GEMINI_MODELS
    else:
        models_to_try = OPENAI_MODELS

    # Get tools and session from persistent manager
    manager = get_mcp_manager()
    try:
        tools, session = await manager.get_tools_and_session()
    except Exception as e:
        logger.error(f"Failed to connect to MCP server: {e}")
        return f"Sorry, I encountered an issue: failed to connect to MCP server. Details: {e}"
    
    last_error = None
    
    # Iterate through models in fallback order
    for model_name in models_to_try:
        logger.info(f"Attempting to run agent using {llm_provider} model: {model_name}")
        try:
            # Initialize the LLM
            if llm_provider == "gemini":
                from langchain_google_genai import ChatGoogleGenerativeAI
                llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
            else:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(model=model_name, temperature=0)
            
            logger.info("LLM created")

            # Compile the LangGraph agent
            executor = create_agent(
                model=llm,
                tools=tools,
                system_prompt=SYSTEM_PROMPT
            )
            logger.info("Agent created")

            # Invoke the LangGraph compiled state graph
            result = await executor.ainvoke({"messages": [("user", query)]})  # type: ignore[call-overload]
            logger.info("Agent invoked successfully")
            logger.info(f"Agent execution succeeded using model: {model_name}")
            
            # Extract final assistant response from messages list
            if "messages" in result and result["messages"]:
                content = result["messages"][-1].content
                if isinstance(content, list):
                    text_parts = []
                    for part in content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            text_parts.append(part.get("text", ""))
                        elif isinstance(part, str):
                            text_parts.append(part)
                    return "".join(text_parts)
                return str(content)
            return "No response message returned from the agent."
        except Exception as e:
            logger.warning(f"Failed executing agent with model '{model_name}': {e}")
            last_error = e
            # Continue to next model in the list
            continue
            
    # If all models fail
    error_msg = f"All models failed for provider '{llm_provider}'. Last error: {last_error}"
    logger.error(error_msg)
    return f"Sorry, I encountered an issue processing your request: {error_msg}"
