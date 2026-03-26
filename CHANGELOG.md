# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-03-26

### Fixed

- **Enriched `create_issue` validation errors with field metadata** — when issue creation fails with a 400 validation error (e.g. missing required custom fields), the error response now includes:
  - Structured field-level errors mapped to their Jira field IDs (not just display names)
  - Auto-fetched create metadata showing all required fields, their types, and allowed values for the project/issue type combination
  - Actionable guidance to pass missing fields via the `customFields` parameter

  This allows AI agents to self-correct on retry instead of guessing from vague error messages. (by [@murdore](https://github.com/murdore))

### Internal

- Added `JiraApiError` class in `api-client.ts` that preserves HTTP status code and structured field errors from the Axios interceptor (previously lost when re-throwing as a plain `Error`)
- Enhanced `formatError` in `formatters.ts` to surface field IDs and actionable retry guidance
- `handleCreateIssue` now auto-fetches `/issue/createmeta` on 400 responses and includes required field information in the error payload

## [1.1.1] - 2026-03-07

### Changed

- Version bump following tool consolidation

## [1.1.0] - 2026-03-07

### Changed

- **Breaking:** Consolidated 16 flat tools into 5 compound tools (`jira_issues`, `jira_search`, `jira_comments`, `jira_workflow`, `jira_attachments`) for a cleaner MCP surface

### Added

- Upload and delete attachment tools

## [1.0.1] - 2025-xx-xx

### Changed

- Minor updates and README improvements

## [1.0.0] - 2025-xx-xx

### Added

- Initial release: Jira MCP server with full Jira Cloud API integration
