import * as net from "net";
import { Client } from "ssh2";

export interface SSHTunnelConfig {
  host?: string;
  vpsPort?: number;
  username?: string;
  password?: string;
}

export async function setupSSHTunnel(
  config: { get: (key: string) => any },
  logger: { warn: (message: string) => void },
  port: string | number,
): Promise<void> {
  const sshConfig = {
    host: process.env["vps-host"],
    port: config.get("sshTunnel.vpsPort") ?? 22,
    username: process.env["vps-user"],
    password: process.env["vps-password"],
  };

  if (!sshConfig.host || !sshConfig.username) {
    return;
  }

  const localPort = parseInt(port as string, 10);
  const remotePort = localPort + 1000;

  return new Promise<void>((resolve, reject) => {
    const conn = new Client();

    conn.on("ready", () => {
      conn.forwardIn("0.0.0.0", remotePort, (err: any) => {
        if (err) {
          conn.end();
          reject(new Error(`Failed to setup reverse tunnel: ${err.message}`));
          return;
        }
        resolve();
      });
    });

    conn.on("tcp connection", (_info: any, accept: any) => {
      const stream = accept();
      const client = net.connect(localPort, "localhost", () => {
        stream.pipe(client).pipe(stream);
      });
    });

    conn.on("close", () => {
      logger.warn("SSH connection closed");
    });

    conn.connect(sshConfig);

    process.on("SIGINT", () => {
      conn.end();
    });
  });
}
