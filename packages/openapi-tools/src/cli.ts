#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import { TokenFetcher, TokenConfig } from "./token-fetcher";
import { ConsulDownloader, ConsulConfig } from "./consul-downloader";
import { ClientGenerator, ClientGeneratorConfig } from "./client-generator";

const program = new Command();

program
  .name("openapi-tools")
  .description("OpenAPI client generation tools for RideHub microservices")
  .version("1.0.0");

// Token fetching command
program
  .command("fetch-token")
  .description("Fetch OAuth2 access token and save to file")
  .requiredOption("-u, --token-url <url>", "OAuth2 token endpoint URL")
  .requiredOption("-c, --client-id <id>", "OAuth2 client ID")
  .requiredOption("-s, --client-secret <secret>", "OAuth2 client secret")
  .requiredOption("-U, --username <username>", "Username for password grant")
  .requiredOption("-p, --password <password>", "Password for password grant")
  .requiredOption("-o, --output <file>", "Output file for token")
  .action(async (options) => {
    const config: TokenConfig = {
      tokenUrl: options.tokenUrl,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      username: options.username,
      password: options.password,
      outputFile: options.output,
    };

    const fetcher = new TokenFetcher();
    await fetcher.fetchToken(config);
  });

// Consul download command
program
  .command("download-specs")
  .description("Download OpenAPI specs from Consul services")
  .requiredOption(
    "-t, --token-file <file>",
    "Path to file containing access token",
  )
  .requiredOption(
    "-c, --consul-url <url>",
    "Consul URL (e.g., https://consul.example.com)",
  )
  .requiredOption(
    "-g, --gateway-url <url>",
    "API Gateway URL (e.g., https://gateway.example.com)",
  )
  .requiredOption("-o, --output <dir>", "Output directory for OpenAPI specs")
  .option("-p, --pattern <pattern>", "Service name pattern (regex)", ".*")
  .option("-m, --mode <mode>", "Fetch mode: gateway or direct", "gateway")
  .action(async (options) => {
    const config: ConsulConfig = {
      tokenFile: options.tokenFile,
      consulUrl: options.consulUrl,
      gatewayUrl: options.gatewayUrl,
      openApiDir: options.output,
      serviceNamePattern: options.pattern,
      fetchMode: options.mode,
    };

    const downloader = new ConsulDownloader();
    await downloader.downloadOpenApiSpecs(config);
  });

// Client generation command
program
  .command("generate-clients")
  .description("Generate TypeScript clients from OpenAPI specs")
  .requiredOption(
    "-i, --input <dir>",
    "Input directory containing OpenAPI specs",
  )
  .requiredOption(
    "-o, --output <dir>",
    "Output directory for generated clients",
  )
  .option(
    "-c, --client <type>",
    "Client type: fetch, axios, angular, node",
    "fetch",
  )
  .option("--generate-services", "Generate service files", true)
  .option("--generate-types", "Generate type files", true)
  .option("--generate-schemas", "Generate schema files", false)
  .action(async (options) => {
    const config: ClientGeneratorConfig = {
      openApiDir: options.input,
      outRoot: options.output,
      clientType: options.client,
      generateServices: options.generateServices,
      generateTypes: options.generateTypes,
      generateSchemas: options.generateSchemas,
    };

    const generator = new ClientGenerator(config);
    await generator.generateClients();
  });

// Combined workflow command
program
  .command("workflow")
  .description(
    "Complete workflow: fetch token, download specs, generate clients",
  )
  .requiredOption("-u, --token-url <url>", "OAuth2 token endpoint URL")
  .requiredOption("-c, --client-id <id>", "OAuth2 client ID")
  .requiredOption("-s, --client-secret <secret>", "OAuth2 client secret")
  .requiredOption("-U, --username <username>", "Username for password grant")
  .requiredOption("-p, --password <password>", "Password for password grant")
  .requiredOption("--consul-url <url>", "Consul URL")
  .requiredOption("--gateway-url <url>", "API Gateway URL")
  .requiredOption("--openapi-dir <dir>", "Directory for OpenAPI specs")
  .requiredOption(
    "--client-dir <dir>",
    "Output directory for generated clients",
  )
  .option("--service-pattern <pattern>", "Service name pattern", ".*")
  .option("--fetch-mode <mode>", "Fetch mode: gateway or direct", "gateway")
  .option(
    "--generator-version <version>",
    "OpenAPI generator version",
    "7.14.0",
  )
  .action(async (options) => {
    try {
      console.log(
        chalk.blue("🚀 Starting OpenAPI client generation workflow..."),
      );

      // Step 1: Fetch token
      console.log(chalk.yellow("\n📋 Step 1: Fetching access token"));
      const tokenConfig: TokenConfig = {
        tokenUrl: options.tokenUrl,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        username: options.username,
        password: options.password,
        outputFile: path.join(process.cwd(), "openapi-auth.properties"),
      };

      const fetcher = new TokenFetcher();
      await fetcher.fetchToken(tokenConfig);

      // Step 2: Download specs
      console.log(chalk.yellow("\n📥 Step 2: Downloading OpenAPI specs"));
      const consulConfig: ConsulConfig = {
        tokenFile: tokenConfig.outputFile,
        consulUrl: options.consulUrl,
        gatewayUrl: options.gatewayUrl,
        openApiDir: options.openapiDir,
        serviceNamePattern: options.servicePattern,
        fetchMode: options.fetchMode,
      };

      const downloader = new ConsulDownloader();
      await downloader.downloadOpenApiSpecs(consulConfig);

      // Step 3: Generate clients
      console.log(chalk.yellow("\n🔧 Step 3: Generating TypeScript clients"));
      const clientConfig: ClientGeneratorConfig = {
        openApiDir: options.openapiDir,
        outRoot: options.clientDir,
        clientType: options.fetchMode === "direct" ? "fetch" : "axios",
        generateServices: true,
        generateTypes: true,
        generateSchemas: false,
      };

      const generator = new ClientGenerator(clientConfig);
      await generator.generateClients();

      console.log(chalk.green("\n✅ Workflow completed successfully!"));
    } catch (error) {
      console.error(
        chalk.red("\n❌ Workflow failed:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Handle unknown commands
program.on("command:*", () => {
  console.error(chalk.red("Invalid command: %s"), program.args.join(" "));
  console.log(chalk.yellow("See --help for a list of available commands."));
  process.exit(1);
});
