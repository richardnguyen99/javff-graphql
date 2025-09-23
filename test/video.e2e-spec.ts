import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";

import { TestSetup } from "./test-setup";
import { Video } from "src/v1/video/video.entity";
import { Actress } from "src/v1/actress/actress.entity";
import { Series } from "src/v1/series/series.entity";
import { Maker } from "src/v1/maker/maker.entity";
import { Genre } from "src/v1/video/genre.entity";

describe("Video Module (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    await TestSetup.setupTestContainer();

    app = await TestSetup.setupTestApp({
      onInit: (appInstance: INestApplication) => {
        appInstance.useGlobalPipes(
          new ValidationPipe({
            transform: true,
          })
        );
        appInstance.useLogger(false);
      },
    });

    dataSource = await TestSetup.getDataSource();
  }, 60000);

  afterAll(async () => {
    await TestSetup.cleanup();
  }, 30000);

  beforeEach(async () => {
    await dataSource
      .getRepository(Video)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Actress)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Series)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Maker)
      .createQueryBuilder()
      .delete()
      .execute();
    await dataSource
      .getRepository(Genre)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  describe("GraphQL Queries", () => {
    let actress: Actress;
    let series: Series;
    let maker: Maker;
    let genre1: Genre;
    let genre2: Genre;

    beforeEach(async () => {
      actress = await dataSource.getRepository(Actress).save({
        name: "Aki",
      });
      series = await dataSource.getRepository(Series).save({
        name: "Test Series",
      });
      maker = await dataSource.getRepository(Maker).save({
        name: "Test Maker",
      });
      genre1 = await dataSource.getRepository(Genre).save({
        name: "Drama",
      });
      genre2 = await dataSource.getRepository(Genre).save({
        name: "Action",
      });

      await dataSource.getRepository(Video).save([
        {
          code: "V001",
          title: "First Video",
          actresses: [actress],
          series: series,
          maker: maker,
          genres: [genre1, genre2],
          releaseDate: "2020-01-01",
          length: 120,
        },
        {
          code: "V002",
          title: "Second Video",
          actresses: [],
          series: null,
          maker: null,
          genres: [],
          releaseDate: "2021-01-01",
          length: 90,
        },
      ]);
    });

    it("should fetch all videos with relations", async () => {
      const query = `#graphql
        query {
          videos {
            totalCount
            edges {
              node {
                id
                code
                title
                releaseDate
                length
                actresses { id name }
                series { id name }
                maker { id name }
                genres { id name }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(2);
      const nodes = response.body.data.videos.edges.map((e) => e.node);

      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        length: 120,
        actresses: [{ id: actress.id.toString(), name: "Aki" }],
        series: { id: series.id.toString(), name: "Test Series" },
        maker: { id: maker.id.toString(), name: "Test Maker" },
        genres: [
          { id: genre1.id.toString(), name: "Drama" },
          { id: genre2.id.toString(), name: "Action" },
        ],
      });

      expect(nodes[1]).toMatchObject({
        code: "V002",
        title: "Second Video",
        length: 90,
        actresses: [],
        series: null,
        maker: null,
        genres: [],
      });
    });

    it("should support pagination with first and after", async () => {
      const query = `#graphql
        query {
          videos(options: { first: 1 }) {
            edges { cursor node { id code title } }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          }
        }
      `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.edges).toHaveLength(1);
      expect(response.body.data.videos.pageInfo.hasNextPage).toBe(true);

      const endCursor = response.body.data.videos.pageInfo.endCursor;
      const nextQuery = `#graphql
        query {
          videos(options: { first: 1, after: "${endCursor}" }) {
            edges { node { code title } }
            pageInfo { hasNextPage hasPreviousPage }
          }
        }
      `;
      const nextResponse = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: nextQuery })
        .expect(200);

      expect(nextResponse.body.data.videos.edges.length).toBe(1);
      expect(nextResponse.body.data.videos.pageInfo.hasPreviousPage).toBe(true);
    });

    it("should paginate backwards (last) and reverse results, setting hasPreviousPage and hasNextPage correctly", async () => {
      const query = `#graphql
        query {
          videos(options: { last: 1 }) {
            edges { node { code title } }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.edges.length).toBe(1);
      expect(response.body.data.videos.pageInfo.hasPreviousPage).toBe(true);
      expect(response.body.data.videos.pageInfo.hasNextPage).toBe(false);
    });

    it("should paginate videos using the 'before' cursor option", async () => {
      const allQuery = `#graphql
        query {
          videos {
            edges { cursor node { id code title } }
            pageInfo { startCursor endCursor }
          }
        }
      `;
      const allResponse = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: allQuery })
        .expect(200);

      const allEdges = allResponse.body.data.videos.edges;
      expect(allEdges.length).toBeGreaterThan(1);

      const beforeCursor = allEdges[1].cursor;

      const beforeQuery = `#graphql
        query {
          videos(options: { before: "${beforeCursor}", first: 1 }) {
            edges { node { id code title } }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          }
        }
      `;

      const beforeResponse = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: beforeQuery })
        .expect(200);

      expect(beforeResponse.body.data.videos.edges.length).toBe(1);
      expect(beforeResponse.body.data.videos.edges[0].node.id).toBe(
        allEdges[0].node.id
      );
      expect(beforeResponse.body.data.videos.pageInfo.hasNextPage).toBe(false);
    });
  });
});
