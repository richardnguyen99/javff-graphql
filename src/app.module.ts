import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

import { V1Module } from "./v1/v1.module";
import { DatabaseConfigService } from "./config/database.config";
import { EnvConfig } from "./config/config.interface";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseConfigService = new DatabaseConfigService(configService);
        return databaseConfigService.createTypeOrmOptions();
      },
      inject: [ConfigService],
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig>) => {
        const isDev =
          configService.get("NODE_ENV", "development") !== "production";

        return {
          autoSchemaFile: join(process.cwd(), "src/schema.gql"),
          path: configService.get("GRAPHQL_PATH", "/graphql/v1"),
          playground: isDev,
          introspection: isDev,
        };
      },
    }),

    V1Module,
  ],

  providers: [DatabaseConfigService],
})
export class AppModule {}
