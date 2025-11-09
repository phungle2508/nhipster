# Development Guidelines for Agentic Coding

## Commands

- **Build**: `npm run build` (turbo runs build across all workspaces)
- **Lint**: `npm run lint` (turbo runs lint across all workspaces)
- **Format**: `npm run format` (prettier writes ts/tsx/md files)
- **Test single file**: `cd apps/backend/ms_route/server && npm run test -- path/to/file.spec.ts`
- **Test with coverage**: `npm run test:cov` (in microservice directory)
- **E2E tests**: `npm run test:e2e` (in microservice directory)
- **Type checking**: `npm run check-types` (turbo runs across workspaces)

## Code Style

- **Formatting**: Prettier with 140 width, single quotes, 2 spaces, no tabs
- **Imports**: Use ES6 imports, prefer named imports, group external/internal
- **TypeScript**: Strict typing, interfaces for DTOs, proper return types
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Error handling**: Use NestJS BadRequestException, proper validation pipes
- **Testing**: Jest with describe/it/expect, mock services in beforeEach
- **React**: "use client" directive, functional components with TypeScript interfaces

## Architecture

- Monorepo with Turbo, microservices in apps/backend/ms\_\*, Next.js apps in apps/docs,apps/web
- Shared packages in packages/ for eslint-config, typescript-config, ui components
- NestJS backend services with TypeORM, Swagger documentation, Eureka service discovery
