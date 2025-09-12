import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { Video } from "src/v1/video/video.entity";
import { ActressModule } from "src/v1/actress/actress.module";
import { Series } from "src/v1/series/series.entity";
import { Maker } from "src/v1/maker/maker.entity";
import { formatError } from "src/common/utils/apollo-format-error";
import { DateTimeScalar } from "src/scalars/date-time.scalar";

type SetupTestAppLifeCycle = {
  onInit?: (app: INestApplication) => void;
};

export class TestSetup {
  private static container: StartedPostgreSqlContainer;
  private static dataSource: DataSource;
  public static app: INestApplication;

  static async setupTestContainer(): Promise<void> {
    this.container = await new PostgreSqlContainer("postgres:15")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .withExposedPorts(5432)
      .start();

    console.log(
      `PostgreSQL container started on port: ${this.container.getMappedPort(5432)}`
    );
  }

  static async setupTestApp({
    onInit,
  }: SetupTestAppLifeCycle): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: this.container.getHost(),
          port: this.container.getMappedPort(5432),
          username: this.container.getUsername(),
          password: this.container.getPassword(),
          database: this.container.getDatabase(),
          entities: [Actress, ActressImage, Video, Series, Maker],
          synchronize: true,
          logging: false,
        }),

        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), "test/schema.gql"),
          path: "/graphql",
          introspection: true,
          formatError: formatError,
        }),

        ActressModule,
      ],

      providers: [DateTimeScalar],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    onInit?.(this.app);

    await this.app.init();

    return this.app;
  }

  static async getDataSource(): Promise<DataSource> {
    if (!this.dataSource) {
      this.dataSource = new DataSource({
        type: "postgres",
        host: this.container.getHost(),
        port: this.container.getMappedPort(5432),
        username: this.container.getUsername(),
        password: this.container.getPassword(),
        database: this.container.getDatabase(),
        entities: [Actress, ActressImage, Video, Series, Maker],
        synchronize: true,
      });

      await this.dataSource.initialize();
    }
    return this.dataSource;
  }

  static async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }

    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }

    if (this.container) {
      await this.container.stop();
    }
  }

  static getContainer(): StartedPostgreSqlContainer {
    return this.container;
  }
}
