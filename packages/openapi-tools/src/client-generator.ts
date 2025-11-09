import fs from "fs-extra";
import path from "path";
import { createClient } from "@hey-api/openapi-ts";
import chalk from "chalk";

export interface ClientGeneratorConfig {
  openApiDir: string;
  outRoot: string;
  clientType?: "fetch" | "axios" | "angular" | "node";
  generateServices?: boolean;
  generateTypes?: boolean;
  generateSchemas?: boolean;
}

export class ClientGenerator {
  private config: ClientGeneratorConfig;

  constructor(config: ClientGeneratorConfig) {
    this.config = {
      clientType: "fetch",
      generateServices: true,
      generateTypes: true,
      generateSchemas: false,
      ...config,
    };
  }

  private async findSpecFiles(): Promise<string[]> {
    const extensions = ["json", "yaml", "yml"];
    const files: string[] = [];

    for (const ext of extensions) {
      const pattern = path.join(this.config.openApiDir, `*.${ext}`);
      const glob = require("glob");
      const matches = glob.sync(pattern);
      files.push(...matches);
    }

    return files;
  }

  private sanitizeServiceName(serviceName: string): string {
    return serviceName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  private async generateTypeScriptClient(specFile: string): Promise<boolean> {
    const serviceName = path.basename(specFile, path.extname(specFile));
    const servicePackage = this.sanitizeServiceName(serviceName);

    // Create service-specific output directory
    const serviceOutputDir = path.join(this.config.outRoot, servicePackage);

    console.log(
      chalk.cyan(`==> Generating TypeScript client for ${serviceName}`),
    );
    console.log(chalk.gray(`    Spec: ${specFile}`));
    console.log(chalk.gray(`    Output: ${serviceOutputDir}`));

    try {
      // Clean existing output directory
      await fs.remove(serviceOutputDir).catch(() => {});
      await fs.ensureDir(serviceOutputDir);

      // Generate TypeScript client using @hey-api/openapi-ts
      const fileUrl = `file://${path.resolve(specFile)}`;
      await createClient([
        {
          input: fileUrl,
          output: serviceOutputDir,
          plugins: ["@hey-api/typescript"],
        },
      ]);

      console.log(chalk.green(`   ✓ OK: ${serviceName}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`   ✗ FAIL: ${serviceName}`));
      console.error(
        chalk.red(
          `    Error: ${error instanceof Error ? error.message : error}`,
        ),
      );
      return false;
    }
  }

  async generateClients(): Promise<void> {
    try {
      await fs.ensureDir(this.config.outRoot);

      const specFiles = await this.findSpecFiles();

      if (specFiles.length === 0) {
        console.log(
          chalk.yellow(`No OpenAPI specs found in ${this.config.openApiDir}`),
        );
        return;
      }

      console.log(chalk.blue(`==> Found ${specFiles.length} OpenAPI spec(s)`));

      let successCount = 0;
      let failCount = 0;
      const failedServices: string[] = [];

      for (const specFile of specFiles) {
        if (await this.generateTypeScriptClient(specFile)) {
          successCount++;
        } else {
          failCount++;
          const serviceName = path.basename(specFile, path.extname(specFile));
          failedServices.push(serviceName);
        }
      }

      console.log(
        chalk.blue(
          `\n==> Generation summary: OK=${successCount} / FAIL=${failCount}`,
        ),
      );

      if (failCount > 0) {
        console.log(
          chalk.yellow(`Failed services: ${failedServices.join(", ")}`),
        );
      }

      if (successCount > 0) {
        console.log(
          chalk.green(`\n✅ TypeScript clients generated successfully!`),
        );
        console.log(
          chalk.blue(`Generated files are in: ${this.config.outRoot}`),
        );
        console.log(
          chalk.gray(
            `You can now import and use generated clients in your TypeScript/JavaScript projects.`,
          ),
        );
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  }
}
