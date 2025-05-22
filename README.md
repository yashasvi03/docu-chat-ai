# DocuChat AI

A conversational search platform for enterprise documents that allows users to chat with their documents and get accurate answers with citations.

## Features

- **Document Management**: Upload, organize, and manage documents (PDF, DOCX, XLSX, TXT, CSV)
- **Google Drive Integration**: Connect to Google Drive to access and search documents
- **Conversational Search**: Ask natural language questions about your documents
- **Accurate Answers**: Get precise answers with citations to the source documents
- **No Hallucinations**: The system only answers based on the uploaded documents
- **Folder Organization**: Organize documents into folders for better management
- **Tag Filtering**: Add tags to documents and filter searches by tags
- **User Authentication**: Secure login with email/password or Google OAuth

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Express.js
- Node.js
- OpenAI API for embeddings and chat completions
- AWS S3 for document storage
- Pinecone for vector database (simulated in-memory for development)

## Project Structure

```
docuchat-ai/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── backend/                # Express.js backend application
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Entry point
│   ├── .env.example        # Environment variables example
│   └── package.json        # Backend dependencies
│
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key
- AWS S3 bucket (optional for production)
- Pinecone account (optional for production)

### Installation

#### Option 1: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/docuchat-ai.git
   cd docuchat-ai
   ```

2. Install all dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys and configuration
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

#### Option 2: Using Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/docuchat-ai.git
   cd docuchat-ai
   ```

2. Create a `.env` file in the root directory with your environment variables:
   ```bash
   cp backend/.env.example .env
   # Edit .env with your API keys and configuration
   ```

3. Build and start the Docker containers:
   ```bash
   docker-compose up -d
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Quick Start Scripts

For convenience, we provide scripts to quickly set up and run the application:

- **Linux/macOS**: Run `./run.sh`
- **Windows**: Run `run.bat`

These scripts will check for Node.js, install dependencies if needed, set up environment variables, and start the development servers.

## Usage

1. **Sign Up/Login**: Create an account or log in with Google
2. **Upload Documents**: Upload your documents or connect to Google Drive
3. **Organize**: Create folders and add tags to organize your documents
4. **Chat**: Ask questions about your documents in the chat interface
5. **Get Answers**: Receive accurate answers with citations to the source documents

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenAI](https://openai.com/) for providing the embedding and chat completion APIs
- [Next.js](https://nextjs.org/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for the styling
