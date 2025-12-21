import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const { DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME, DB_PORT } = process.env;
    const missingVars = [
      ["DB_USER", DB_USER],
      ["DB_PASSWORD", DB_PASSWORD],
      ["DB_SERVER", DB_SERVER],
      ["DB_NAME", DB_NAME],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missingVars.length) {
      throw new Error(
        `Missing required database environment variables: ${missingVars.join(
          ", "
        )}. Check your .env file.`
      );
    }

    const port = DB_PORT ? Number(DB_PORT) : undefined;
    if (DB_PORT && Number.isNaN(port)) {
      throw new Error("DB_PORT must be a valid number.");
    }

    const serverRaw = DB_SERVER as string;
    let server = serverRaw;
    let instanceName: string | undefined;

    // Allow specifying a named instance using HOST\INSTANCE.
    // If an explicit port is provided, connect directly by host:port and skip instance lookup.
    if (serverRaw.includes("\\")) {
      const [host, instance] = serverRaw.split("\\");
      server = host;
      instanceName = port ? undefined : instance;
    }

    const dbconfig: sql.config = {
      user: DB_USER as string,
      password: DB_PASSWORD as string,
      server,
      database: DB_NAME as string,
      ...(port ? { port } : {}),
      options: {
        encrypt: false,
        trustServerCertificate: true,
        ...(instanceName ? { instanceName } : {}),
      },
    };

    await sql.connect(dbconfig);
    console.log("MS SQL Connected");
  } catch (error) {
    console.error("DB Connection Failed", error);
  }
};

export default sql;
