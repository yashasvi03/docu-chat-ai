# Contributing to DocuChat AI

Thank you for considering contributing to DocuChat AI! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment information (OS, browser, etc.)

### Suggesting Features

If you have an idea for a new feature, please create an issue with the following information:

- A clear, descriptive title
- A detailed description of the feature
- Any relevant mockups or examples
- Why this feature would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Clone your fork of the repository
   ```bash
   git clone https://github.com/your-username/docuchat-ai.git
   cd docuchat-ai
   ```

2. Install dependencies
   ```bash
   npm run install:all
   ```

3. Set up environment variables
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your API keys and configuration
   ```

4. Start the development servers
   ```bash
   npm run dev
   ```

## Project Structure

Please see the README.md for an overview of the project structure.

## Coding Standards

- Follow the ESLint configuration
- Write clear, descriptive commit messages
- Add comments for complex logic
- Write tests for new features
- Update documentation as needed

## Testing

- Run tests before submitting a PR
  ```bash
  npm test
  ```

- Ensure your code passes linting
  ```bash
  npm run lint
  ```

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to functions and classes
- Keep API documentation up to date

## Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in the release notes

## License

By contributing to DocuChat AI, you agree that your contributions will be licensed under the project's MIT License.
