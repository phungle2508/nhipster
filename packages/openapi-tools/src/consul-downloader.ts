import axios from "axios";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export interface ConsulConfig {
  tokenFile: string;
  consulUrl: string;
  gatewayUrl: string;
  openApiDir: string;
  serviceNamePattern?: string;
  fetchMode?: "gateway" | "direct";
}

interface ConsulService {
  ServiceAddress: string;
  Address: string;
  ServicePort: number;
}

export class ConsulDownloader {
  private async readToken(tokenFile: string): Promise<string> {
    try {
      const content = await fs.readFile(tokenFile, "utf8");
      const match = content.match(/^access\.token=(.+)$/m);
      if (!match) {
        throw new Error("No access.token found in file");
      }
      return match[1]!.trim();
    } catch (error) {
      throw new Error(
        `Failed to read token from ${tokenFile}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async getServices(
    consulUrl: string,
    token: string,
  ): Promise<string[]> {
    try {
      const response = await axios.get(`${consulUrl}/v1/catalog/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return Object.keys(response.data);
    } catch (error) {
      throw new Error(
        `Failed to fetch services from Consul: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async getServiceInstances(
    consulUrl: string,
    token: string,
    service: string,
  ): Promise<ConsulService[]> {
    try {
      const response = await axios.get(
        `${consulUrl}/v1/catalog/service/${service}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch service instances for ${service}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async downloadOpenApiSpec(
    url: string,
    token: string,
    outputPath: string,
  ): Promise<boolean> {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "text",
      });

      // Validate that it's a valid OpenAPI/Swagger spec
      const data =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);
      const parsed = JSON.parse(data);

      if (!parsed.openapi && !parsed.swagger) {
        throw new Error("Not a valid OpenAPI/Swagger specification");
      }

      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, JSON.stringify(parsed, null, 2), "utf8");
      return true;
    } catch (error) {
      console.warn(
        chalk.yellow(
          `    WARN: Failed to download spec from ${url}: ${error instanceof Error ? error.message : error}`,
        ),
      );
      return false;
    }
  }

  async downloadOpenApiSpecs(config: ConsulConfig): Promise<void> {
    try {
      console.log(chalk.blue("==> Fetching service list from Consul..."));

      const token = await this.readToken(config.tokenFile);
      const services = await this.getServices(config.consulUrl, token);

      const pattern = new RegExp(config.serviceNamePattern || ".*");
      const matchingServices = services.filter((service) =>
        pattern.test(service),
      );

      console.log(
        chalk.blue(`Found ${matchingServices.length} matching services`),
      );

      await fs.ensureDir(config.openApiDir);

      let successCount = 0;
      let failCount = 0;

      for (const service of matchingServices) {
        console.log(chalk.cyan(` -> Processing service: ${service}`));

        let openApiUrl = "";

        if (config.fetchMode === "direct") {
          const instances = await this.getServiceInstances(
            config.consulUrl,
            token,
            service,
          );
          if (instances.length === 0) {
            console.warn(
              chalk.yellow(`    WARN: No instances found for ${service}`),
            );
            failCount++;
            continue;
          }

          const instance = instances[0];
          if (!instance) {
            console.warn(
              chalk.yellow(`    WARN: No valid instance for ${service}`),
            );
            failCount++;
            continue;
          }
          const address = instance.ServiceAddress || instance.Address;
          const port = instance.ServicePort;

          if (!address || !port) {
            console.warn(
              chalk.yellow(`    WARN: No address/port for ${service}`),
            );
            failCount++;
            continue;
          }

          openApiUrl = `http://${address}:${port}/v3/api-docs`;
        } else {
          // Gateway mode
          openApiUrl = `${config.gatewayUrl}/services/${service}/v3/api-docs/springdocDefault`;
        }

        const outputPath = path.join(config.openApiDir, `${service}.json`);
        console.log(
          chalk.gray(`    Downloading: ${openApiUrl} -> ${outputPath}`),
        );

        if (await this.downloadOpenApiSpec(openApiUrl, token, outputPath)) {
          console.log(chalk.green(`    ✓ Success: ${service}`));
          successCount++;
        } else {
          // Clean up failed download
          await fs.remove(outputPath).catch(() => {});
          failCount++;
        }
      }

      console.log(
        chalk.blue(
          `\n==> Done. Success: ${successCount}, Failed: ${failCount}`,
        ),
      );
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  }
}
