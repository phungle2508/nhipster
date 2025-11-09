export interface VaultConfig {
  enabled: boolean;
  uri: string;
  token: string;
  kv: {
    enabled: boolean;
    backend: string;
    "application-name": string;
  };
}

export async function loadVaultSecrets(
  config: { get: (key: string) => any },
  logger: {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  },
): Promise<void> {
  const useVault = config.get("vault.enabled");

  if (!useVault) {
    logger.log("Vault is disabled, skipping secret loading");
    return;
  }

  const vault = require("node-vault");

  const vaultConfig = {
    apiVersion: "v1",
    endpoint: config.get("vault.uri"),
    token: config.get("vault.token"),
  };

  if (!vaultConfig.token) {
    logger.warn("Vault token not provided, skipping Vault secret loading");
    return;
  }

  try {
    logger.log(`Loading secrets from Vault at ${vaultConfig.endpoint}`);
    const client = vault(vaultConfig);

    if (config.get("vault.kv.enabled")) {
      const kvBackend = config.get("vault.kv.backend");
      const appName = config.get("vault.kv.application-name");
      const appSecretPath = `${kvBackend}/data/${appName}`;

      try {
        const appResult = await client.read(appSecretPath);
        if (appResult?.data?.data) {
          const appSecrets = appResult.data.data;
          logger.log(
            `Loaded ${Object.keys(appSecrets).length} application secrets from Vault`,
          );

          Object.entries(appSecrets).forEach(([key, secretValue]) => {
            process.env[key] = secretValue as string;
            (config as any)[key] = secretValue;
          });
        } else {
          logger.warn(`No application secrets found at ${appSecretPath}`);
        }
      } catch (appError: any) {
        logger.warn(
          `Failed to load application secrets from ${appSecretPath}: ${appError.message}`,
        );
      }
    }

    const infraSecretPath = "secret/data/infrastructure";
    if (infraSecretPath) {
      try {
        const infraResult = await client.read(infraSecretPath);
        if (infraResult?.data?.data) {
          const infraSecrets = infraResult.data.data;
          logger.log(
            `Loaded ${Object.keys(infraSecrets).length} infrastructure secrets from Vault`,
          );

          Object.entries(infraSecrets).forEach(([key, secretValue]) => {
            process.env[key] = secretValue as string;
            (config as any)[key] = secretValue;
            logger.log(key);
          });
        } else {
          logger.warn(`No infrastructure secrets found at ${infraSecretPath}`);
        }
      } catch (infraError: any) {
        logger.warn(
          `Failed to load infrastructure secrets from ${infraSecretPath}: ${infraError.message}`,
        );
      }
    }

    logger.log("Vault secret loading completed successfully");
  } catch (error: any) {
    logger.error(`Failed to connect to Vault: ${error.message}`);
    logger.warn("Application will continue with local configuration only");
  }
}
