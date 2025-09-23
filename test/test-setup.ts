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
import { Genre } from "src/v1/video/genre.entity";
import { VideoModule } from "src/v1/video/video.module";

type SetupTestAppLifeCycle = {
  onInit?: (app: INestApplication) => void;
};

export class TestSetup {
  private static _container: StartedPostgreSqlContainer;
  private static _dataSource: DataSource;
  public static _app: INestApplication;

  static async setupTestContainer(): Promise<void> {
    this._container = await new PostgreSqlContainer("postgres:15")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .withExposedPorts(5432)
      .start();

    console.log(
      `PostgreSQL container started on port: ${this._container.getMappedPort(5432)}`
    );
  }

  static async setupTestApp({
    onInit,
  }: SetupTestAppLifeCycle): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: this._container.getHost(),
          port: this._container.getMappedPort(5432),
          username: this._container.getUsername(),
          password: this._container.getPassword(),
          database: this._container.getDatabase(),
          entities: [Actress, ActressImage, Video, Series, Maker, Genre],
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
        VideoModule,
      ],

      providers: [DateTimeScalar],
    }).compile();

    this._app = moduleFixture.createNestApplication();

    onInit?.(this._app);
    await this._app.init();

    return this._app;
  }

  static async getDataSource(): Promise<DataSource> {
    if (!this._dataSource) {
      this._dataSource = new DataSource({
        type: "postgres",
        host: this._container.getHost(),
        port: this._container.getMappedPort(5432),
        username: this._container.getUsername(),
        password: this._container.getPassword(),
        database: this._container.getDatabase(),
        entities: [Actress, ActressImage, Video, Series, Maker, Genre],
        synchronize: false,
      });

      await this._dataSource.initialize();
    }

    return this._dataSource;
  }

  static async cleanup(): Promise<void> {
    if (this._app) {
      await this._app.close();
    }

    if (this._dataSource && this._dataSource.isInitialized) {
      await this._dataSource.destroy();
    }

    if (this._container) {
      await this._container.stop();
    }
  }

  static getContainer(): StartedPostgreSqlContainer {
    return this._container;
  }
}
