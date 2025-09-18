import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import { register } from "tsconfig-paths";
import * as path from "path";

// Load environment variables
config();

// Register tsconfig paths - this reads your tsconfig.json automatically
register({
  baseUrl: path.resolve(__dirname),
  paths: require("./tsconfig.json").compilerOptions.paths,
});

const configService = new ConfigService();

export default new DataSource({
  type: "postgres",
  host: configService.get<string>("DB_HOST", "localhost"),
  port: configService.get<number>("DB_PORT", 55432),
  username: configService.get<string>("DB_USERNAME", "postgres"),
  password: configService.get<string>("DB_PASSWORD", "postgres"),
  database: configService.get<string>("DB_NAME", "javdb"),
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "migrations",
  synchronize: false,
});
