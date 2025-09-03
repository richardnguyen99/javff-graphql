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
}
