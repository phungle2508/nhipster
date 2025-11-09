export interface ConsulConfig {
  host: string;
  port: number;
  scheme: string;
  "service-id": string;
  "service-name": string;
  "health-check-interval": string;
  "health-check-timeout": string;
  "health-check-deregister-critical-service-after": string;
  "metadata-map": {
    zone: string;
    "git-version": string;
    "git-commit": string;
    "git-branch": string;
  };
}

export function registerWithConsul(
  config: { get: (key: string) => any },
  logger: { log: (message: string) => void; error: (message: string) => void },
  port: string | number,
): void {
  logger.log(
    `Registering with Consul ${config.get("consul.host")}:${config.get("consul.port")}`,
  );
  const Consul = require("consul");
  const consul = new Consul({
    host: config.get("consul.host"),
    port: config.get("consul.port"),
    scheme: config.get("consul.scheme"),
    promisify: true,
    secure: true,
    rejectUnauthorized: false,
  });

  const serviceId = config
    .get("consul.service-id")
    .replace("${random.value}", Math.random().toString(36).substring(7));
  const service = {
    id: serviceId,
    name: config.get("consul.service-name"),
    address: process.env["vps-host"],
    port: Number(port) + 1000,
    check: {
      http: `http://${process.env["vps-host"]}:${Number(port) + 1000}/management/health`,
      interval: config.get("consul.health-check-interval"),
      timeout: config.get("consul.health-check-timeout"),
      deregistercriticalserviceafter: config.get(
        "consul.health-check-deregister-critical-service-after",
      ),
    },
    meta: {
      zone: config.get("consul.metadata-map.zone"),
      "git-version": config.get("consul.metadata-map.git-version"),
      "git-commit": config.get("consul.metadata-map.git-commit"),
      "git-branch": config.get("consul.metadata-map.git-branch"),
    },
  };

  consul.agent.service.register(service, (err: any) => {
    if (err) {
      logger.error(`Failed to register with Consul: ${err.message}`);
    } else {
      logger.log(`Consul registration complete for service ${serviceId}`);
    }
  });

  process.on("SIGINT", () => {
    consul.agent.service.deregister(serviceId, () => {
      logger.log(`Deregistered service ${serviceId} from Consul`);
      process.exit();
    });
  });
}
