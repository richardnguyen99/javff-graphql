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

      const soeSeries = await dataSource.getRepository(Series).save({
        id: 3749,
        name: "S1 GIRLS COLLECTION",
      });
      const mdSeries = await dataSource.getRepository(Series).save({
        id: 15112,
        name: "猿轡レ×プ調教",
      });
      const snMaker = await dataSource.getRepository(Maker).save({
        id: 565,
        name: "エスワン ナンバーワンスタイル",
      });
      const mdMaker = await dataSource.getRepository(Maker).save({
        id: 3905,
        name: "ムーディーズ",
      });
      const opMaker = await dataSource.getRepository(Maker).save({
        id: 818,
        name: "OPPAI",
      });

      const actress1 = await dataSource.getRepository(Actress).save({
        name: "沖田杏梨",
        displayName: "Okita Anri",
      });
      const actress2 = await dataSource.getRepository(Actress).save({
        name: "Hitomi（田中瞳）",
        displayName: "Hitomi (Tanaka Hitomi)",
      });
      const actress3 = await dataSource.getRepository(Actress).save({
        name: "蓮実クレア",
        displayName: "Claire Hasumi",
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
        {
          code: "SOE-123",
          title: "S1 Sample Video",
          actresses: [actress1],
          series: soeSeries,
          maker: snMaker,
          genres: [genre1],
          releaseDate: "2022-01-01",
          length: 150,
        },
        {
          code: "MDYD-456",
          title: "Moodyz Sample Video",
          actresses: [actress1, actress2],
          series: mdSeries,
          maker: mdMaker,
          genres: [genre2],
          releaseDate: "2023-01-01",
          length: 180,
        },
        {
          code: "PPPD-789",
          title: "OPPAI Sample Video",
          actresses: [actress1, actress2, actress3],
          series: null,
          maker: opMaker,
          genres: [genre1, genre2],
          releaseDate: "2024-01-01",
          length: 200,
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

      expect(response.body.data.videos.totalCount).toBe(5);
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

    it("should filter videos by actressIds", async () => {
      const actressRecord = await dataSource.getRepository(Actress).findOneBy({
        name: "Aki",
      });
      expect(actressRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { actressIds: ["${actressRecord.id}"] }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        actresses: [{ id: actressRecord.id.toString(), name: "Aki" }],
      });
    });

    it("should return an empty list when no videos match the actressIds filter", async () => {
      const query = `#graphql
        query {
          videos(options: { actressIds: ["999999"] }) {
            totalCount
            edges {
              node {
                id
                code
                title
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(0);
      expect(response.body.data.videos.edges).toHaveLength(0);
    });

    it("should filter videos by genreIds", async () => {
      const genreRecord = await dataSource.getRepository(Genre).findOneBy({
        name: "Drama",
      });
      expect(genreRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { genreIds: ["${genreRecord.id}"] }) {
            totalCount
            edges {
              node {
                id
                code
                title
                genres { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(3);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        genres: expect.arrayContaining([
          { id: genreRecord.id.toString(), name: "Drama" },
        ]),
      });
    });

    it("should filter videos by makerId", async () => {
      const makerRecord = await dataSource.getRepository(Maker).findOneBy({
        name: "Test Maker",
      });
      expect(makerRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { makerId: "${makerRecord.id}" }) {
            totalCount
            edges {
              node {
                id
                code
                title
                maker { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        maker: { id: makerRecord.id.toString(), name: "Test Maker" },
      });
    });

    it("should filter videos by seriesId", async () => {
      const seriesRecord = await dataSource.getRepository(Series).findOneBy({
        name: "Test Series",
      });
      expect(seriesRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { seriesId: "${seriesRecord.id}" }) {
            totalCount
            edges {
              node {
                id
                code
                title
                series { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        series: { id: seriesRecord.id.toString(), name: "Test Series" },
      });
    });

    it("should filter videos by actressIds and genreIds", async () => {
      const actressRecord = await dataSource.getRepository(Actress).findOneBy({
        name: "Aki",
      });
      const genreRecord = await dataSource.getRepository(Genre).findOneBy({
        name: "Drama",
      });
      expect(actressRecord).toBeDefined();
      expect(genreRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { actressIds: ["${actressRecord.id}"], genreIds: ["${genreRecord.id}"] }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
                genres { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        actresses: [{ id: actressRecord.id.toString(), name: "Aki" }],
        genres: expect.arrayContaining([
          { id: genreRecord.id.toString(), name: "Drama" },
        ]),
      });
    });

    it("should filter videos by actressIds and makerId", async () => {
      const actressRecord = await dataSource
        .getRepository(Actress)
        .findOneBy({ name: "Aki" });
      const makerRecord = await dataSource
        .getRepository(Maker)
        .findOneBy({ name: "Test Maker" });

      expect(actressRecord).toBeDefined();
      expect(makerRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            actressIds: ["${actressRecord.id}"],
            makerId: "${makerRecord.id}"
          }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
                maker { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        actresses: [{ id: actressRecord.id.toString(), name: "Aki" }],
        maker: { id: makerRecord.id.toString(), name: "Test Maker" },
      });
    });

    it("should filter videos by actressIds and seriesId", async () => {
      const actressRecord = await dataSource
        .getRepository(Actress)
        .findOneBy({ name: "Aki" });
      const seriesRecord = await dataSource
        .getRepository(Series)
        .findOneBy({ name: "Test Series" });

      expect(actressRecord).toBeDefined();
      expect(seriesRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            actressIds: ["${actressRecord.id}"],
            seriesId: "${seriesRecord.id}"
          }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
                series { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        actresses: [{ id: actressRecord.id.toString(), name: "Aki" }],
        series: { id: seriesRecord.id.toString(), name: "Test Series" },
      });
    });

    it("should filter videos by genreIds and seriesId", async () => {
      const genreRecord1 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Drama" });
      const genreRecord2 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Action" });
      const seriesRecord = await dataSource
        .getRepository(Series)
        .findOneBy({ name: "Test Series" });

      expect(genreRecord1).toBeDefined();
      expect(genreRecord2).toBeDefined();
      expect(seriesRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            genreIds: ["${genreRecord1.id}", "${genreRecord2.id}"],
            seriesId: "${seriesRecord.id}"
          }) {
            totalCount
            edges {
              node {
                id
                code
                title
                genres { id name }
                series { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        genres: expect.arrayContaining([
          { id: genreRecord1.id.toString(), name: "Drama" },
          { id: genreRecord2.id.toString(), name: "Action" },
        ]),
        series: { id: seriesRecord.id.toString(), name: "Test Series" },
      });
    });

    it("should filter videos by makerId and seriesId", async () => {
      const makerRecord = await dataSource
        .getRepository(Maker)
        .findOneBy({ name: "Test Maker" });
      const seriesRecord = await dataSource
        .getRepository(Series)
        .findOneBy({ name: "Test Series" });

      expect(makerRecord).toBeDefined();
      expect(seriesRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            makerId: "${makerRecord.id}",
            seriesId: "${seriesRecord.id}"
          }) {
            totalCount
            edges {
              node {
                id
                code
                title
                maker { id name }
                series { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        maker: { id: makerRecord.id.toString(), name: "Test Maker" },
        series: { id: seriesRecord.id.toString(), name: "Test Series" },
      });
    });

    it("should return empty when filtering by valid actressIds and invalid genreIds", async () => {
      const actressRecord = await dataSource.getRepository(Actress).findOneBy({
        name: "Aki",
      });
      expect(actressRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: { actressIds: ["${actressRecord.id}"], genreIds: ["999999"] }) {
            totalCount
            edges { node { id code title } }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(0);
      expect(response.body.data.videos.edges).toHaveLength(0);
    });

    it("should filter videos by actressIds, genreIds, makerId, and seriesId", async () => {
      const actressRecord = await dataSource
        .getRepository(Actress)
        .findOneBy({ name: "Aki" });
      const genreRecord1 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Drama" });
      const genreRecord2 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Action" });
      const makerRecord = await dataSource
        .getRepository(Maker)
        .findOneBy({ name: "Test Maker" });
      const seriesRecord = await dataSource
        .getRepository(Series)
        .findOneBy({ name: "Test Series" });

      expect(actressRecord).toBeDefined();
      expect(genreRecord1).toBeDefined();
      expect(genreRecord2).toBeDefined();
      expect(makerRecord).toBeDefined();
      expect(seriesRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            actressIds: ["${actressRecord.id}"],
            genreIds: ["${genreRecord1.id}", "${genreRecord2.id}"],
            makerId: "${makerRecord.id}",
            seriesId: "${seriesRecord.id}"
          }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
                genres { id name }
                maker { id name }
                series { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);
      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V001",
        title: "First Video",
        actresses: [{ id: actressRecord.id.toString(), name: "Aki" }],
        genres: expect.arrayContaining([
          { id: genreRecord1.id.toString(), name: "Drama" },
          { id: genreRecord2.id.toString(), name: "Action" },
        ]),
        maker: { id: makerRecord.id.toString(), name: "Test Maker" },
        series: { id: seriesRecord.id.toString(), name: "Test Series" },
      });
    });

    it("should return empty when one of the filters does not match", async () => {
      const actressRecord = await dataSource
        .getRepository(Actress)
        .findOneBy({ name: "Aki" });
      const genreRecord1 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Drama" });
      const genreRecord2 = await dataSource
        .getRepository(Genre)
        .findOneBy({ name: "Action" });
      const makerRecord = await dataSource
        .getRepository(Maker)
        .findOneBy({ name: "Test Maker" });

      expect(actressRecord).toBeDefined();
      expect(genreRecord1).toBeDefined();
      expect(genreRecord2).toBeDefined();
      expect(makerRecord).toBeDefined();

      const query = `#graphql
        query {
          videos(options: {
            actressIds: ["${actressRecord.id}"],
            genreIds: ["${genreRecord1.id}", "${genreRecord2.id}"],
            makerId: "${makerRecord.id}",
            seriesId: "999999"
          }) {
            totalCount
            edges { node { id code title } }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(0);
      expect(response.body.data.videos.edges).toHaveLength(0);
    });

    it("should filter videos by actressCount = 1", async () => {
      const query = `#graphql
        query {
          videos(options: { actressCount: 1 }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
              }
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
        actresses: [{ id: expect.any(String), name: "Aki" }],
      });
    });

    it("should filter videos by actressCount = 3", async () => {
      const query = `#graphql
        query {
          videos(options: { actressCount: 3 }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id displayName }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);

      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "PPPD-789",
        title: "OPPAI Sample Video",
        actresses: expect.arrayContaining([
          { id: expect.any(String), displayName: "Okita Anri" },
          { id: expect.any(String), displayName: "Hitomi (Tanaka Hitomi)" },
          { id: expect.any(String), displayName: "Claire Hasumi" },
        ]),
      });
    });

    it("should filter videos by actressCount = 0", async () => {
      const query = `#graphql
        query {
          videos(options: { actressCount: 0 }) {
            totalCount
            edges {
              node {
                id
                code
                title
                actresses { id name }
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(1);

      const nodes = response.body.data.videos.edges.map((e) => e.node);
      expect(nodes[0]).toMatchObject({
        code: "V002",
        title: "Second Video",
        actresses: [],
      });
    });

    it("should return empty when no video matches the actressCount", async () => {
      const query = `#graphql
        query {
          videos(options: { actressCount: 5 }) {
            totalCount
            edges { node { id code title actresses { id name } } }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.videos.totalCount).toBe(0);
      expect(response.body.data.videos.edges).toHaveLength(0);
    });
  });
});
