# Contributing to Budget Manager

Thank you for your interest in contributing! Here's how to get started.

## Reporting Bugs

Before opening a bug report, please check if the issue already exists. When filing a new issue, include:

- A clear title and description
- Steps to reproduce the problem
- Expected vs actual behavior
- Your OS, Docker version, and browser (if relevant)

## Suggesting Features

Open an issue with the `enhancement` label. Describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Submitting a Pull Request

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Set up the development environment:
   ```bash
   # Start all services
   make up

   # Or run locally without Docker
   cd api && npm install && npm run dev
   cd ui && npm install && npm run dev
   ```

3. Make your changes, following the guidelines below.

4. Commit with a clear message:
   ```bash
   git commit -m "feat: add expense export to CSV"
   ```

5. Push and open a Pull Request against `main`.

## Code Guidelines

- **Frontend:** React functional components, Tailwind CSS for styling
- **Backend:** Fastify route handlers, Mongoose models
- **i18n:** All UI strings must use `t('key')` — add both `en` and `tr` translations in `ui/src/i18n.js`. No hardcoded strings.
- **Formatting:** Follow the existing code style in each file

## Project Structure

```
budget-manager/
├── api/        # Fastify backend
├── ui/         # React frontend
├── mcp-server/ # Claude Code MCP integration
├── nginx/      # Reverse proxy config
└── Makefile    # Dev commands (make help)
```

## Questions?

Open an issue and we'll be happy to help.
