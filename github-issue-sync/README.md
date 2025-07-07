# GitHub Issue Sync

A TypeScript tool that syncs issues between a local JSON file and a GitHub repository. It compares timestamps and keeps the newer version in both places.

## Features

- Bidirectional sync between local JSON file and GitHub repository
- Timestamp-based conflict resolution (newer version wins)
- Create new issues on GitHub from local-only entries
- Update existing issues in both directions
- Comprehensive error handling and logging

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**
   - `GITHUB_TOKEN`: Generate a personal access token at https://github.com/settings/tokens
     - Required scopes: `repo`, `read:project`
   - `GITHUB_OWNER`: Your GitHub username (default: 7frank)
   - `GITHUB_REPO`: Your repository name
   - `ISSUES_FILE`: Path to your local JSON file (default: ./issues.json)

4. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Sync Issues

```bash
npm run sync
```

### Development Mode

```bash
npm run dev
```

## JSON File Format

The local issues file should contain an array of issue objects:

```json
[
  {
    "title": "Issue title",
    "body": "Issue description",
    "state": "open",
    "labels": ["bug", "enhancement"],
    "assignee": "username",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
]
```

### Issue Object Properties

- `title` (required): Issue title
- `body` (optional): Issue description
- `state`: Either "open" or "closed"
- `labels` (optional): Array of label names
- `assignee` (optional): GitHub username
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp
- `id` (auto-generated): GitHub issue ID
- `number` (auto-generated): GitHub issue number

## How It Works

1. **Loads** local issues from JSON file and fetches GitHub issues via API
2. **Compares** timestamps between local and GitHub versions
3. **Syncs** newer versions:
   - If GitHub issue is newer → updates local JSON
   - If local issue is newer → updates GitHub via API
   - If timestamps are equal → no change needed
4. **Creates** new GitHub issues from local-only entries
5. **Saves** updated local issues back to JSON file

## Error Handling

- Failed API calls are logged but don't stop the sync process
- Individual issue sync failures are collected and reported
- Local file is always updated with successful changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
