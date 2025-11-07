# Documentation Cache

This directory stores frequently accessed library documentation fetched from Context7 MCP to reduce token usage.

## Structure

Each library should have its own file named after the library:
- `react.md` - React documentation
- `supabase.md` - Supabase documentation
- `tanstack-query.md` - TanStack Query documentation
- etc.

## Usage Guidelines

1. **When to cache**: Store documentation for libraries you reference frequently during development
2. **What to include**: Focus on the most commonly used APIs, patterns, and examples
3. **Updating**: Refresh documentation when you upgrade library versions
4. **Organization**: Keep each file focused on one library/topic

## Fetching Documentation

To fetch documentation using Context7 MCP:

1. Resolve the library ID:
   ```
   Use: mcp__context7__resolve-library-id
   ```

2. Get the documentation:
   ```
   Use: mcp__context7__get-library-docs
   ```

3. Save the relevant parts to a markdown file in this directory

## Current Documentation

<!-- Add links to cached documentation files as they are created -->
- (Add documentation files here as needed)
