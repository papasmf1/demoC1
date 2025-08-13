# Claude Code Project Configuration

This file contains project-specific information and preferences for Claude Code.

##코드 스타일 
- 모든 함수는 화살표 함수로 작성
- 세미콜론 항상 사용
- 들여쓰기는 2칸 

## Project Overview
- **Project Type**: Development workspace
- **Working Directory**: C:\workClaude3
- **Platform**: Windows (win32)

## Templates
The project includes Claude templates stored in `~/.claude-templates/`:
- **Components**: React component generation templates
- **Features**: API endpoints and bugfix workflow templates
- **Tests**: Testing templates
- **Docs**: Documentation templates

### Available Templates
1. **React Component Template** (`~/.claude-templates/components/react-component.txt`)
   - Creates TypeScript React components with props interfaces
   - Includes Storybook stories and unit tests
   - Usage: `COMPONENT_NAME="MyComponent" envsubst < ~/.claude-templates/components/react-component.txt | claude`

2. **API Endpoint Template** (`~/.claude-templates/features/api-endpoint.txt`)
   - Generates REST API endpoints with full CRUD operations
   - Includes Express.js router, validation, error handling, and Swagger docs
   - Usage: `RESOURCE_NAME="users" envsubst < ~/.claude-templates/features/api-endpoint.txt | claude`

3. **Bugfix Workflow Template** (`~/.claude-templates/features/bugfix.txt`)
   - Structured approach to bug fixing with analysis and testing
   - Usage: `BUG_DESCRIPTION="description" envsubst < ~/.claude-templates/features/bugfix.txt | claude`

## Development Commands
- Add your commonly used commands here (e.g., build, test, lint commands)
- This helps Claude understand your project's workflow

## Notes
- Template system uses `envsubst` for variable substitution
- Korean language templates for better localization