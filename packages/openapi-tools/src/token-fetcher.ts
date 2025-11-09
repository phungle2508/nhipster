import axios from "axios";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export interface TokenConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  outputFile: string;
}

export class TokenFetcher {
  async fetchToken(config: TokenConfig): Promise<void> {
    try {
      console.log(chalk.blue("Fetching access token..."));

      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", config.clientId);
      params.append("client_secret", config.clientSecret);
      params.append("username", config.username);
      params.append("password", config.password);

      const response = await axios.post(config.tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = response.data.access_token;

      if (!accessToken || accessToken === "null") {
        throw new Error("Failed to obtain access_token");
      }

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(config.outputFile));

      // Write token to file
      const tokenContent = `access.token=${accessToken}\n`;
      await fs.writeFile(config.outputFile, tokenContent, "utf8");

      console.log(chalk.green(`✓ Token written to ${config.outputFile}`));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          chalk.red("Failed to fetch token:"),
          error.response?.data || error.message,
        );
      } else {
        console.error(
          chalk.red("Error:"),
          error instanceof Error ? error.message : error,
        );
      }
      process.exit(1);
    }
  }
}
