# OpenAPI Tools

TypeScript/Node.js replacement for the shell scripts used in RideHub microservices for OpenAPI client generation.

## Features

- **Token Fetching**: OAuth2 password grant token authentication
- **Consul Integration**: Download OpenAPI specs from Consul service discovery
- **Client Generation**: Generate TypeScript clients using @hey-api/openapi-ts
- **CLI Interface**: Command-line tools with comprehensive options
- **Workflow Automation**: Complete end-to-end automation

## Installation

```bash
npm install @repo/openapi-tools
```

## CLI Usage

### Execution Methods

Since this is a local package in a monorepo, you can execute the CLI using any of these methods:

#### Method 1: Direct Node Execution (Recommended)

```bash
node packages/openapi-tools/dist/cli.js <command> [options]
```

#### Method 2: NPX

```bash
npx @repo/openapi-tools <command> [options]
```

#### Method 3: From Package Directory

```bash
cd packages/openapi-tools
npm run build && node dist/cli.js <command> [options]
```

### Fetch Token

```bash
node packages/openapi-tools/dist/cli.js fetch-token \
  --token-url "https://auth.example.com/oauth2/token" \
  --client-id "your-client-id" \
  --client-secret "your-client-secret" \
  --username "your-username" \
  --password "your-password" \
  --output "openapi-auth.properties"
```

### Download OpenAPI Specs

```bash
node packages/openapi-tools/dist/cli.js download-specs \
  --token-file "openapi-auth.properties" \
  --consul-url "https://consul.example.com" \
  --gateway-url "https://gateway.example.com" \
  --output "target/openapi" \
  --pattern "ms_.*" \
  --mode gateway
```

### Generate Clients

```bash
node packages/openapi-tools/dist/cli.js generate-clients \
  --input "target/openapi" \
  --output "src/client" \
  --client "fetch"
```

### Complete Workflow

```bash
node packages/openapi-tools/dist/cli.js workflow \
  --token-url "https://auth.example.com/oauth2/token" \
  --client-id "your-client-id" \
  --client-secret "your-client-secret" \
  --username "your-username" \
  --password "your-password" \
  --consul-url "https://consul.example.com" \
  --gateway-url "https://gateway.example.com" \
  --openapi-dir "target/openapi" \
  --client-dir "src/client" \
  --service-pattern "ms_.*" \
  --fetch-mode gateway
```

### Quick Start Examples

```bash
# Get help
node packages/openapi-tools/dist/cli.js --help

# Get help for specific command
node packages/openapi-tools/dist/cli.js workflow --help

# Run complete workflow with your credentials
node packages/openapi-tools/dist/cli.js workflow \
  --token-url "https://your-auth-server.com/oauth2/token" \
  --client-id "your-client-id" \
  --client-secret "your-client-secret" \
  --username "your-username" \
  --password "your-password" \
  --consul-url "https://your-consul.com" \
  --gateway-url "https://your-gateway.com" \
  --openapi-dir "target/openapi" \
  --client-dir "src/client" \
  --service-pattern "ms_.*" \
  --fetch-mode gateway
```

## Programmatic Usage

```typescript
import {
  TokenFetcher,
  ConsulDownloader,
  ClientGenerator,
} from "@repo/openapi-tools";

// Fetch token
const tokenFetcher = new TokenFetcher();
await tokenFetcher.fetchToken({
  tokenUrl: "https://auth.example.com/oauth2/token",
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  username: "your-username",
  password: "your-password",
  outputFile: "openapi-auth.properties",
});

// Download specs
const downloader = new ConsulDownloader();
await downloader.downloadOpenApiSpecs({
  tokenFile: "openapi-auth.properties",
  consulUrl: "https://consul.example.com",
  gatewayUrl: "https://gateway.example.com",
  openApiDir: "target/openapi",
  serviceNamePattern: "ms_.*",
  fetchMode: "gateway",
});

// Generate clients
const generator = new ClientGenerator({
  openApiDir: "target/openapi",
  outRoot: "src/client",
  clientType: "fetch",
});
await generator.generateClients();
```

## Migration from Shell Scripts

This package provides direct replacements for:

- `script/fetch-token.sh` → `node packages/openapi-tools/dist/cli.js fetch-token`
- `script/consul-download-openapis.sh` → `node packages/openapi-tools/dist/cli.js download-specs`
- `script/generate-clients.sh` → `node packages/openapi-tools/dist/cli.js generate-clients`

The `workflow` command combines all three steps into a single automated process.

## Requirements

- Node.js 18+
- No Java required (uses pure TypeScript generation)
- Generates modern TypeScript clients with fetch/axios support

## Configuration

All commands support comprehensive configuration options. Run the following for detailed usage information:

```bash
# General help
node packages/openapi-tools/dist/cli.js --help

# Command-specific help
node packages/openapi-tools/dist/cli.js fetch-token --help
node packages/openapi-tools/dist/cli.js download-specs --help
node packages/openapi-tools/dist/cli.js generate-clients --help
node packages/openapi-tools/dist/cli.js workflow --help
```

## Development

### Building the Package

```bash
cd packages/openapi-tools
npm run build
```

### Testing

```bash
cd packages/openapi-tools
npm run test
```

### Local Development

For development, you can use the watch mode:

```bash
cd packages/openapi-tools
npm run dev
```
