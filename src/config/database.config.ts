import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get<"postgres">("DB_TYPE", "postgres"),
      host: this.configService.get<string>("DB_HOST", "localhost"),
      port: this.configService.get<number>("DB_PORT", 55432),
      username: this.configService.get<string>("DB_USERNAME", "postgres"),
      password: this.configService.get<string>("DB_PASSWORD", "postgres"),
      database: this.configService.get<string>("DB_NAME", "javdb"),
      autoLoadEntities: this.configService.get<boolean>(
        "DB_AUTO_LOAD_ENTITIES",
        true
      ),
      synchronize: false, // Disable synchronize
      migrationsRun: this.configService.get<boolean>("DB_MIGRATIONS_RUN", true),
      migrations: [__dirname + "/../migrations/*{.ts,.js}"],
      migrationsTableName: "migrations",
    };
  }
}
