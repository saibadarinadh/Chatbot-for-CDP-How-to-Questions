# CDP Support Agent Chatbot

This project implements a chatbot designed to answer "how-to" questions related to four Customer Data Platforms (CDPs): Segment, mParticle, Lytics, and Zeotap. The chatbot extracts information from the official documentation of these CDPs to provide users with guidance on performing tasks within each platform.

## Features

*   **Answering "How-to" Questions:** The chatbot understands and responds to user questions about performing specific tasks or using features within Segment, mParticle, Lytics, and Zeotap.
*   **Information Extraction:** The chatbot retrieves relevant information from the official CDP documentation to answer user questions.
*   **Handling Question Variations:** The chatbot handles variations in question phrasing and terminology, including long questions and questions irrelevant to CDPs (returning a default response).
*   **Cross-CDP Comparisons (Bonus):** The chatbot can answer questions comparing the approaches or functionalities between the four CDPs.
*   **Clear UI:** The chatbot has a clear and easy-to-use user interface.

## Tech Stack

*   **Frontend:**
    *   **React:** For building the user interface and handling component logic.
    *   **Create React App:**  For scaffolding the React project.
    *   **CSS Modules:** For styling components with scoped CSS.
*   **Backend:**
    *   **Python:** The core language for the backend logic.
    *   **FastAPI:**  A modern, fast (high-performance), web framework for building APIs.
    *   **Sentence Transformers:** For generating document and query embeddings.
    *   **FAISS:** For efficient similarity search in a large document corpus.
    *   **Beautiful Soup:** For parsing HTML content from the scraped documentation.
*   **Other Libraries:**
    *   requests, numpy, scikit-learn, nltk, transformers, torch, tensorflow

## Data Sources

The chatbot uses the following official CDP documentation:

*   Segment: [https://segment.com/docs/](https://segment.com/docs/)
*   mParticle: [https://docs.mparticle.com/](https://docs.mparticle.com/)
*   Lytics: [https://docs.lytics.com/](https://docs.lytics.com/)
*   Zeotap: [https://docs.zeotap.com/home/en-us/](https://docs.zeotap.com/home/en-us/)

## Architecture

1.  **Data Scraping:** A Python script (`scraper.py`) scrapes the documentation from the four CDPs and saves the content to local files.
2.  **Document Indexing:** A Python script (`indexer.py`) processes the scraped documents, chunks them into smaller segments, generates embeddings using Sentence Transformers, and builds a FAISS index for efficient similarity search.
3.  **Query Engine:** A Python class (`query_engine.py`) handles user queries. It encodes the query using Sentence Transformers, searches the FAISS index for relevant document chunks, and formulates an answer based on the retrieved information.
4.  **API:** A FastAPI application (`app.py`) exposes an API endpoint for processing user queries and returning the chatbot's response.
5.  **Frontend:** A React application provides a user interface for interacting with the chatbot. It sends user queries to the backend API and displays the chatbot's responses.

## Key Components and Logic

*   **`scraper.py`:**
    *   Downloads and parses HTML content from the CDP documentation websites.
    *   Extracts relevant text from the HTML, removing irrelevant elements like navigation and sidebars.
    *   Saves the extracted content to local files, organized by CDP.
*   **`indexer.py`:**
    *   Loads the scraped documents from local files.
    *   Splits the documents into smaller chunks to improve search accuracy.
    *   Generates embeddings for each chunk using Sentence Transformers.
    *   Builds a FAISS index to store the embeddings and enable efficient similarity search.
*   **`query_engine.py`:**
    *   Loads the FAISS index and the document chunks.
    *   Encodes user queries using Sentence Transformers.
    *   Searches the FAISS index for the most relevant document chunks.
    *   Formulates an answer based on the retrieved information, including extracting steps for "how-to" questions and comparing information for cross-CDP questions.
*   **`app.py`:**
    *   Defines the API endpoints for processing user queries.
    *   Receives user queries from the frontend, passes them to the query engine, and returns the chatbot's response.
*   **`frontend/src/App.js`:**
    *   Manages the overall state of the chat application.
    *   Sends user queries to the backend API.
    *   Displays the chat messages, including user queries and chatbot responses.
*   **`frontend/src/components/ChatInterface.js`:**
    *   Provides the user interface for entering and sending chat messages.
*   **`frontend/src/components/Message.js`:**
    *   Displays individual chat messages, including the chatbot's responses and any relevant context information.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd chat-bot
    ```

3.  **Install backend dependencies:**

    ```bash
    cd backend
    pip install -r requirements.txt
    ```

4.  **Run the backend:**

    ```bash
    uvicorn app:app --reload
    ```

5.  **Install frontend dependencies:**

    ```bash
    cd ../frontend
    npm install
    # or
    yarn install
    ```

6.  **Run the frontend:**

    ```bash
    npm start
    # or
    yarn start
    ```

7.  **Open your browser and navigate to `http://localhost:3000`.**

## API Endpoints

*   `POST /api/query`: Processes a user query and returns the chatbot's response.
*   `GET /api/health`: Performs a health check and returns the status of the API.

