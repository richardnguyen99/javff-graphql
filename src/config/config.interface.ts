export interface DatabaseConfig {
  type: "postgres";
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  autoLoadEntities: boolean;
  synchronize: boolean;
}

export interface AppConfig {
  port: number;
  graphqlPath: string;
  nodeEnv: "development" | "production";
}

export interface EnvConfig {
  DB_TYPE: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SYNCHRONIZE: boolean;
  DB_AUTO_LOAD_ENTITIES: boolean;

  PORT: number;
  GRAPHQL_PATH: string;
  NODE_ENV: "development" | "production";
}
