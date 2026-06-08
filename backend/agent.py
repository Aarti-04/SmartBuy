# agent.py
import os
import sys
import logging
from typing import List

from dotenv import load_dotenv
load_dotenv()

from langchain_core.messages import SystemMessage
from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain.agents import create_agent

# Configure logging
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful grocery shopping assistant for InstaMART.
When a user searches for a product:
1. Use search_product to find matching items.
2. Present results clearly with name, price, and quantity.
3. Offer to get more details on any specific item.
Always be concise and format prices clearly.
Answer the user's request based on the tool execution output."""

# Fallback Gemini models as requested by the user
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini"]

async def run_agent(query: str) -> str:
    """
    Runs the LangChain agent. Connects to the FastMCP server via stdio,
    loads the tools, initializes the LLM with fallback support for Gemini models,
    and executes the query.
    """
    llm_provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    if llm_provider == "gemini":
        models_to_try = GEMINI_MODELS
    else:
        models_to_try = OPENAI_MODELS

    # Path to the MCP server script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    mcp_server_path = os.path.join(current_dir, "mcp_server.py")
    
    # Configure MCP Stdio Client parameters using the active python interpreter
    server_params = StdioServerParameters(
        command=sys.executable,
        args=[mcp_server_path],
        env=os.environ.copy()
    )
    
    last_error = None
    
    # Iterate through models in fallback order
    for model_name in models_to_try:
        logger.info(f"Attempting to run agent using {llm_provider} model: {model_name}")
        try:
            # We open the stdio client inside the try block to ensure connection freshness
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    try:
                        await session.initialize()
                        logger.info("MCP initialized")

                        tools = await load_mcp_tools(session)
                        logger.info(f"Loaded {len(tools)} tools")
                        
                        # Initialize the LLM
                        if llm_provider == "gemini":
                            from langchain_google_genai import ChatGoogleGenerativeAI
                            llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
                        else:
                            from langchain_openai import ChatOpenAI
                            llm = ChatOpenAI(model=model_name, temperature=0)
                        
                        logger.info("LLM created")

                        # Compile the LangGraph agent using the custom create_agent factory
                        executor = create_agent(
                            model=llm,
                            tools=tools,
                            system_prompt=SYSTEM_PROMPT
                        )
                        logger.info("Agent created")

                        
                        # Invoke the LangGraph compiled state graph
                        result = await executor.ainvoke({"messages": [("user", query)]})
                        logger.info("Agent invoked")
                        logger.info(f"Agent execution succeeded using model: {model_name}")
                        
                        # Extract final assistant response from messages list
                        if "messages" in result and result["messages"]:
                            return result["messages"][-1].content
                        return "No response message returned from the agent."
                    except Exception as ex:
                        logger.error(f"Failed to initialize/run agent with model '{model_name}': {ex}")
                        return f"Sorry, I encountered an issue processing your request: {ex}"
                    
        except Exception as e:
            logger.warning(f"Failed executing agent with model '{model_name}': {e}")
            last_error = e
            # Continue to next model in the list
            continue
            
    # If all models fail
    error_msg = f"All models failed for provider '{llm_provider}'. Last error: {last_error}"
    logger.error(error_msg)
    return f"Sorry, I encountered an issue processing your request: {error_msg}"
