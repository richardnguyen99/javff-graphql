import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";

import { TestSetup } from "./test-setup";
import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";

describe("Actress Module (e2e)", () => {
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
      },
    });

    dataSource = await TestSetup.getDataSource();
  }, 60000);

  afterAll(async () => {
    await TestSetup.cleanup();
  }, 30000);

  beforeEach(async () => {
    await dataSource
      .getRepository(ActressImage)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(Actress)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  describe("GraphQL Queries", () => {
    beforeEach(async () => {
      await dataSource.getRepository(Actress).save([
        {
          name: "Aki",
          cup: "B",
          bust: 80,
          waist: 58,
          hip: 85,
          birthday: "1995-01-01",
        },
        {
          name: "Mio",
          cup: "C",
          bust: 85,
          waist: 60,
          hip: 88,
          birthday: "1990-05-10",
        },
        {
          name: "Yuna",
          cup: "D",
          bust: 90,
          waist: 62,
          hip: 90,
          birthday: "1985-12-31",
        },
        {
          name: "NoCup",
          cup: null,
          bust: null,
          waist: null,
          hip: null,
          birthday: null,
        },
        {
          name: "NoBust",
          cup: null,
          bust: null,
          waist: null,
          hip: null,
          birthday: null,
        },
      ]);
    });

    it("should fetch all actresses", async () => {
      const query = `
        query {
          actresses {
            totalCount
            edges {
              node {
                id
                name
                displayName
                dmmId
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses).toMatchObject({
        edges: [
          { node: { name: "Aki", displayName: null, dmmId: null } },
          { node: { name: "Mio", displayName: null, dmmId: null } },
          { node: { name: "Yuna", displayName: null, dmmId: null } },
          { node: { name: "NoCup", displayName: null, dmmId: null } },
          { node: { name: "NoBust", displayName: null, dmmId: null } },
        ],
      });
    });

    it("should filter actresses by cup", async () => {
      const query = `
      query {
        actresses(options: { cup: "C" }) {
          edges { node { name cup } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses.edges).toHaveLength(1);
      expect(response.body.data.actresses.edges[0].node).toMatchObject({
        name: "Mio",
        cup: "C",
      });
      expect(response.body.data.actresses.totalCount).toBe(1);
    });

    it("should filter actresses by bust", async () => {
      const query = `
      query {
        actresses(options: { bust: 85 }) {
          edges { node { name bust } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(names).toEqual(expect.arrayContaining(["Mio", "Yuna"]));
      expect(response.body.data.actresses.totalCount).toBe(2);
    });

    it("should filter actresses by waist", async () => {
      const query = `
      query {
        actresses(options: { waist: 60 }) {
          edges { node { name waist } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(names).toEqual(expect.arrayContaining(["Mio", "Yuna"]));
      expect(response.body.data.actresses.totalCount).toBe(2);
    });

    it("should filter actresses by hip", async () => {
      const query = `
      query {
        actresses(options: { hip: 88 }) {
          edges { node { name hip } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses.edges).toHaveLength(2);
      expect(response.body.data.actresses.totalCount).toBe(2);

      expect(response.body.data.actresses.edges[0].node.name).toBe("Mio");
      expect(response.body.data.actresses.edges[1].node.name).toBe("Yuna");
    });

    it("should filter actresses by year (age)", async () => {
      const query = `
      query {
        actresses(options: { year: 1990 }) {
          edges { node { name birthday } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(names).toEqual(expect.arrayContaining(["Mio", "Yuna"]));
      expect(response.body.data.actresses.totalCount).toBe(2);
    });

    it("should filter actresses by multiple options", async () => {
      const query = `
      query {
        actresses(options: { cup: "D", bust: 90, waist: 62, hip: 90, year: 1985 }) {
          edges { node { name cup bust waist hip birthday } }
          totalCount
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses.edges).toHaveLength(1);
      expect(response.body.data.actresses.edges[0].node.name).toBe("Yuna");
      expect(response.body.data.actresses.totalCount).toBe(1);
    });

    it("should sort actresses by cup ascending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "cup", sortOrder: ASC }) {
        edges { node { name cup } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const cups = response.body.data.actresses.edges.map((e) => e.node.cup);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(cups).toEqual(["B", "C", "D", null, null]);
      expect(names).toEqual(["Aki", "Mio", "Yuna", "NoCup", "NoBust"]);
    });

    it("should sort actresses by cup descending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "cup", sortOrder: DESC }) {
        edges { node { name cup } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const cups = response.body.data.actresses.edges.map((e) => e.node.cup);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(cups).toEqual(["D", "C", "B", null, null]);
      expect(names).toEqual(["Yuna", "Mio", "Aki", "NoBust", "NoCup"]);
    });

    it("should sort actresses by bust ascending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "bust", sortOrder: ASC }) {
        edges { node { name bust } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const busts = response.body.data.actresses.edges.map((e) => e.node.bust);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      // Should be sorted: 80, 85, 90, null, null (nulls last)
      expect(busts).toEqual([80, 85, 90, null, null]);
      expect(names).toEqual(["Aki", "Mio", "Yuna", "NoCup", "NoBust"]);
    });

    it("should sort actresses by bust descending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "bust", sortOrder: DESC }) {
        edges { node { name bust } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const busts = response.body.data.actresses.edges.map((e) => e.node.bust);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      // Should be sorted: 90, 85, 80, null, null (nulls last)
      expect(busts).toEqual([90, 85, 80, null, null]);
      expect(names).toEqual(["Yuna", "Mio", "Aki", "NoBust", "NoCup"]);
    });

    it("should sort actresses by waist ascending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "waist", sortOrder: ASC }) {
        edges { node { name waist } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const waists = response.body.data.actresses.edges.map(
        (e) => e.node.waist
      );
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      // Should be sorted: 58, 60, 62, null, null (nulls last)
      expect(waists).toEqual([58, 60, 62, null, null]);
      expect(names).toEqual(["Aki", "Mio", "Yuna", "NoCup", "NoBust"]);
    });

    it("should sort actresses by waist descending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "waist", sortOrder: DESC }) {
        edges { node { name waist } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const waists = response.body.data.actresses.edges.map(
        (e) => e.node.waist
      );
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(waists).toEqual([62, 60, 58, null, null]);
      expect(names).toEqual(["Yuna", "Mio", "Aki", "NoBust", "NoCup"]);
    });

    it("should sort actresses by hip ascending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "hip", sortOrder: ASC }) {
        edges { node { name hip } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const hips = response.body.data.actresses.edges.map((e) => e.node.hip);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(hips).toEqual([85, 88, 90, null, null]);
      expect(names).toEqual(["Aki", "Mio", "Yuna", "NoCup", "NoBust"]);
    });

    it("should sort actresses by hip descending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "hip", sortOrder: DESC }) {
        edges { node { name hip } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const hips = response.body.data.actresses.edges.map((e) => e.node.hip);
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(hips).toEqual([90, 88, 85, null, null]);
      expect(names).toEqual(["Yuna", "Mio", "Aki", "NoBust", "NoCup"]);
    });

    it("should sort actresses by birthday ascending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "birthday", sortOrder: ASC }) {
        edges { node { name birthday } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const birthdays = response.body.data.actresses.edges.map(
        (e) => e.node.birthday
      );
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(birthdays).toEqual([
        "1985-12-31",
        "1990-05-10",
        "1995-01-01",
        null,
        null,
      ]);
      expect(names).toEqual(["Yuna", "Mio", "Aki", "NoCup", "NoBust"]);
    });

    it("should sort actresses by birthday descending", async () => {
      const query = `
    query {
      actresses(options: { sortBy: "birthday", sortOrder: DESC }) {
        edges { node { name birthday } }
      }
    }
  `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      const birthdays = response.body.data.actresses.edges.map(
        (e) => e.node.birthday
      );
      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(birthdays).toEqual([
        "1995-01-01",
        "1990-05-10",
        "1985-12-31",
        null,
        null,
      ]);
      expect(names).toEqual(["Aki", "Mio", "Yuna", "NoBust", "NoCup"]);
    });

    it("should support pagination with first and after", async () => {
      const query = `
      query {
        actresses(options: { first: 2 }) {
          edges { cursor node { name } }
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
      }
    `;
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses.edges).toHaveLength(2);
      expect(response.body.data.actresses.pageInfo.hasNextPage).toBe(true);

      // Use endCursor as after for next page
      const endCursor = response.body.data.actresses.pageInfo.endCursor;
      const nextQuery = `
      query {
        actresses(options: { first: 2, after: "${endCursor}" }) {
          edges { node { name } }
          pageInfo { hasNextPage hasPreviousPage }
        }
      }
    `;
      const nextResponse = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: nextQuery })
        .expect(200);

      expect(
        nextResponse.body.data.actresses.edges.length
      ).toBeGreaterThanOrEqual(1);
      expect(nextResponse.body.data.actresses.pageInfo.hasPreviousPage).toBe(
        true
      );
    });

    it("should paginate backwards (last) and reverse results, setting hasPreviousPage and hasNextPage correctly", async () => {
      const query = `
    query {
      actresses(options: { last: 2 }) {
        edges { node { name } }
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

      const names = response.body.data.actresses.edges.map((e) => e.node.name);

      expect(names).toEqual(["Mio", "Aki"]);
      expect(response.body.data.actresses.pageInfo.hasPreviousPage).toBe(true);
      expect(response.body.data.actresses.pageInfo.hasNextPage).toBe(false);
    });

    it("should fetch actress by id", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Test Actress",
        displayName: "Test Display Name",
        bust: 85.5,
        waist: 60.0,
        hip: 88.0,
      });

      const query = `
        query($id: Int!) {
          actress(id: $id) {
            id
            name
            displayName
            bust
            waist
            hip
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { id: actress.id },
        })
        .expect(200);

      expect(response.body.data.actress).toMatchObject({
        id: actress.id.toString(),
        name: "Test Actress",
        displayName: "Test Display Name",
        bust: 85.5,
        waist: 60,
        hip: 88,
      });
    });

    it("should search actresses by name", async () => {
      await dataSource.getRepository(Actress).save([
        { name: "Yui Hatano", displayName: "Yui Hatano" },
        { name: "Akira Kano", displayName: "Akira Kano" },
        { name: "Rina Ishihara", displayName: "Rina Ishihara" },
      ]);

      const query = `
        query($name: String!) {
          searchActressesByName(name: $name) {
            id
            name
            displayName
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { name: "Yui" },
        })
        .expect(200);

      expect(response.body.data.searchActressesByName).toHaveLength(1);
      expect(response.body.data.searchActressesByName[0].name).toBe(
        "Yui Hatano"
      );
    });

    it("should fetch actress by dmmId", async () => {
      await dataSource.getRepository(Actress).save({
        name: "Test Actress",
        dmmId: "unique123",
      });

      const query = `
        query($dmmId: String!) {
          actressByDmmId(dmmId: $dmmId) {
            id
            name
            dmmId
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { dmmId: "unique123" },
        })
        .expect(200);

      expect(response.body.data.actressByDmmId).toMatchObject({
        name: "Test Actress",
        dmmId: "unique123",
      });
    });
  });

  describe("GraphQL Mutations", () => {
    it("should create a new actress", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
            displayName
            dmmId
            bust
            waist
            hip
          }
        }
      `;

      const input = {
        name: "New Actress",
        displayName: "New Display Name",
        dmmId: "new123",
        bust: 90.0,
        waist: 58.0,
        hip: 85.0,
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data.createActress).toMatchObject({
        name: "New Actress",
        displayName: "New Display Name",
        dmmId: "new123",
        bust: 90,
        waist: 58,
        hip: 85,
      });

      const saved = await dataSource.getRepository(Actress).findOne({
        where: { dmmId: "new123" },
      });
      expect(saved).toBeTruthy();
      expect(saved.name).toBe("New Actress");
    });

    it("should update an actress", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Original Name",
        displayName: "Original Display",
      });

      const mutation = `
        mutation($id: Int!, $input: UpdateActressInput!) {
          updateActress(id: $id, input: $input) {
            id
            name
            displayName
          }
        }
      `;

      const input = {
        name: "Updated Name",
        displayName: "Updated Display",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { id: actress.id, input },
        })
        .expect(200);

      expect(response.body.data.updateActress).toMatchObject({
        id: actress.id.toString(),
        name: "Updated Name",
        displayName: "Updated Display",
      });
    });

    it("should delete an actress", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "To Be Deleted",
      });

      const mutation = `
        mutation($id: Int!) {
          deleteActress(id: $id)
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { id: actress.id },
        })
        .expect(200);

      expect(response.body.data.deleteActress).toBe(true);

      const deleted = await dataSource.getRepository(Actress).findOne({
        where: { id: actress.id },
      });
      expect(deleted).toBeNull();
    });

    it("should create a new actress with images", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
            images {
              id
              url
              attribute
            }
          }
        }
      `;

      const input = {
        name: "Actress With Images",
        images: [
          { url: "http://example.com/image1.jpg", attribute: "large" },
          { url: "http://example.com/image2.jpg", attribute: "small" },
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data.createActress).toMatchObject({
        name: "Actress With Images",
        images: [
          {
            id: expect.any(String),
            url: "http://example.com/image1.jpg",
            attribute: "large",
          },
          {
            id: expect.any(String),
            url: "http://example.com/image2.jpg",
            attribute: "small",
          },
        ],
      });

      const saved = await dataSource.getRepository(Actress).findOne({
        where: { name: "Actress With Images" },
        relations: ["images"],
      });

      expect(saved).toBeTruthy();
      expect(saved.images).toHaveLength(2);
      expect(saved.images.map((i) => i.url)).toEqual(
        expect.arrayContaining([
          "http://example.com/image1.jpg",
          "http://example.com/image2.jpg",
        ])
      );
    });

    it("should fail if name is missing", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
          }
        }
      `;

      const input = {
        displayName: "No Name",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value { displayName: "No Name" }; Field "name" of required type "String!" was not provided.'
      );
    });

    it("should fail if name is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
          }
        }
      `;

      const input = {
        name: 12345, // invalid type
        displayName: "Number Name",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 12345 at "input.name"; String cannot represent a non string value: 12345'
      );
    });

    it("should fail if name is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
          }
        }
      `;

      const input = {
        name: "   ",
        displayName: "Number Name",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "name must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if bust is a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
            bust
          }
        }
      `;

      const input = {
        name: "Invalid Bust",
        bust: "not-a-number", // invalid type
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(JSON.stringify(response.body.errors)).toMatch(/bust/);
    });

    it("should fail if dmmId is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", dmmId: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "dmmId must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if dmmId is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", dmmId: 12345 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 12345 at "input.dmmId"; String cannot represent a non string value: 12345'
      );
    });

    it("should fail if displayName is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", displayName: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "displayName must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if displayName is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", displayName: 12345 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 12345 at "input.displayName"; String cannot represent a non string value: 12345'
      );
    });

    it("should pass if displayName is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id displayName }
        }
      `;
      const input = { name: "Test", displayName: "Valid Name" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.displayName).toEqual(
        "Valid Name"
      );
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if ruby is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", ruby: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "ruby must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if ruby is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", ruby: 12345 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 12345 at "input.ruby"; String cannot represent a non string value: 12345'
      );
    });

    it("should pass if ruby is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id ruby }
        }
      `;
      const input = { name: "Test", ruby: "ルビー" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.ruby).toEqual("ルビー");
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if bust is a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", bust: "not-a-number" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "not-a-number" at "input.bust"; Float cannot represent non numeric value: "not-a-number"'
      );
    });

    it("should fail if bust is less than 1", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", bust: 0 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "bust must be greater than or equal to 1"
      );
    });

    it("should fail if bust has more than 2 decimal places", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", bust: 88.123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "bust must contain at most 2 decimal places"
      );
    });

    it("should pass if bust is a valid number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id bust }
        }
      `;
      const input = { name: "Test", bust: 88.12 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.bust).toEqual(88.12);
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if cup is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", cup: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "cup must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if cup is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", cup: 123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 123 at "input.cup"; String cannot represent a non string value: 123'
      );
    });

    it("should pass if cup is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id cup }
        }
      `;
      const input = { name: "Test", cup: "D" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.cup).toEqual("D");
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if waist is a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", waist: "not-a-number" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "not-a-number" at "input.waist"; Float cannot represent non numeric value: "not-a-number"'
      );
    });

    it("should fail if waist is less than 1", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", waist: 0 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "waist must be greater than or equal to 1"
      );
    });

    it("should fail if waist has more than 2 decimal places", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", waist: 60.123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "waist must contain at most 2 decimal places"
      );
    });

    it("should pass if waist is a valid number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id waist }
        }
      `;
      const input = { name: "Test", waist: 60.12 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.waist).toEqual(60.12);
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if hip is a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", hip: "not-a-number" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "not-a-number" at "input.hip"; Float cannot represent non numeric value: "not-a-number"'
      );
    });

    it("should fail if hip is less than 0", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", hip: -1 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "hip must be greater than or equal to 0"
      );
    });

    it("should fail if hip has more than 2 decimal places", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", hip: 90.123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "hip must contain at most 2 decimal places"
      );
    });

    it("should pass if hip is a valid number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id hip }
        }
      `;

      const input = { name: "Test", hip: 90.12 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.hip).toEqual(90.12);
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if height is a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;

      const input = { name: "Test", height: "not-a-number" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "not-a-number" at "input.height"; Float cannot represent non numeric value: "not-a-number"'
      );
    });

    it("should fail if height is less than 0", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;

      const input = { name: "Test", height: -1 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "height must be greater than or equal to 1"
      );
    });

    it("should fail if height has more than 2 decimal places", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", height: 160.123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "height must contain at most 2 decimal places"
      );
    });

    it("should pass if height is a valid number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id height }
        }
      `;
      const input = { name: "Test", height: 160.12 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.height).toEqual(160.12);
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if birthday is not a valid ISO 8601 string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", birthday: "31-12-2000" }; // not ISO 8601
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "birthday must be a valid ISO 8601 date string"
      );
    });

    it("should fail if birthday is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", birthday: 20200101 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 20200101 at "input.birthday"; String cannot represent a non string value: 20200101'
      );
    });

    it("should pass if birthday is a valid ISO 8601 string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id birthday }
        }
      `;
      const input = { name: "Test", birthday: "2000-12-30" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(
        response.body.data.createActress.birthday.startsWith("2000-12-30")
      ).toBe(true);
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if birthday is a valid ISO 8601 string but not a valid date", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id birthday }
        }
      `;
      const input = { name: "Test", birthday: "2000-12-32" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "birthday must be a valid ISO 8601 date string"
      );
    });

    it("should fail if bloodType is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", bloodType: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "bloodType must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if bloodType is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", bloodType: 123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 123 at "input.bloodType"; String cannot represent a non string value: 123'
      );
    });

    it("should pass if bloodType is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id bloodType }
        }
      `;
      const input = { name: "Test", bloodType: "A" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.bloodType).toEqual("A");
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if hobby is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", hobby: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "hobby must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if hobby is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", hobby: 123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 123 at "input.hobby"; String cannot represent a non string value: 123'
      );
    });

    it("should pass if hobby is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id hobby }
        }
      `;
      const input = { name: "Test", hobby: "Reading" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.hobby).toEqual("Reading");
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if prefectures is a blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", prefectures: "   " };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        "prefectures must not neither be empty nor contain only whitespace"
      );
    });

    it("should fail if prefectures is a number", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id }
        }
      `;
      const input = { name: "Test", prefectures: 123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 123 at "input.prefectures"; String cannot represent a non string value: 123'
      );
    });

    it("should pass if prefectures is a valid non-blank string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id prefectures }
        }
      `;
      const input = { name: "Test", prefectures: "Tokyo" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.prefectures).toEqual("Tokyo");
      expect(response.body.errors).toBeUndefined();
    });

    it("should fail if images is not an array", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id images { url attribute } }
        }
      `;
      const input = { name: "Test", images: "not-an-array" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "not-an-array" at "input.images"; Expected type "CreateActressImageInput" to be an object.'
      );
    });

    it("should fail if an image is missing url", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id images { url attribute } }
        }
      `;
      const input = { name: "Test", images: [{ attribute: "profile" }] };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value { attribute: "profile" } at "input.images[0]"; Field "url" of required type "String!" was not provided.'
      );
    });

    it("should fail if an image url is not a string", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id images { url attribute } }
        }
      `;
      const input = {
        name: "Test",
        images: [{ url: 123, attribute: "profile" }],
      };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value 123 at "input.images[0].url"; String cannot represent a non string value: 123'
      );
    });

    it("should pass if images is a valid array of CreateActressImageInput", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) { id images { url attribute } }
        }
      `;
      const input = {
        name: "Test",
        images: [
          { url: "http://example.com/1.jpg", attribute: "profile" },
          { url: "http://example.com/2.jpg", attribute: "cover" },
        ],
      };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.data.createActress.images).toHaveLength(2);
      expect(response.body.errors).toBeUndefined();
    });

    it("should update an actress's name and displayName", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Original Name",
        displayName: "Original Display",
      });

      const mutation = `
    mutation($id: Int!, $input: UpdateActressInput!) {
      updateActress(id: $id, input: $input) {
        id
        name
        displayName
      }
    }
  `;

      const input = {
        name: "Updated Name",
        displayName: "Updated Display",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { id: actress.id, input },
        })
        .expect(200);

      expect(response.body.data.updateActress).toMatchObject({
        id: actress.id.toString(),
        name: "Updated Name",
        displayName: "Updated Display",
      });
    });

    it("should update an actress's bust, waist, hip, and birthday", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Body Update",
        bust: 80,
        waist: 60,
        hip: 85,
        birthday: "1990-01-01",
      });

      const mutation = `
    mutation($id: Int!, $input: UpdateActressInput!) {
      updateActress(id: $id, input: $input) {
        id
        bust
        waist
        hip
        birthday
      }
    }
  `;

      const input = {
        bust: 90,
        waist: 65,
        hip: 95,
        birthday: "1995-05-05",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { id: actress.id, input },
        })
        .expect(200);

      expect(response.body.data.updateActress).toMatchObject({
        id: actress.id.toString(),
        bust: 90,
        waist: 65,
        hip: 95,
        birthday: expect.stringContaining("1995-05-05"),
      });
    });

    it("should return null if updating a non-existent actress", async () => {
      const mutation = `
    mutation($id: Int!, $input: UpdateActressInput!) {
      updateActress(id: $id, input: $input) {
        id
        name
      }
    }
  `;

      const input = {
        name: "Does Not Exist",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { id: 99999, input },
        })
        .expect(200);

      expect(response.body.data).toBeNull();
      expect(response.body.errors[0].message).toEqual(
        "Actress with ID 99999 not found"
      );
    });

    it("should add an image to an existing actress", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Image Actress",
      });

      const mutation = `
    mutation($input: AddActressImageInput!) {
      addActressImage(input: $input) {
        id
        url
        attribute
      }
    }
  `;

      const input = {
        actressId: actress.id,
        url: "http://example.com/image.jpg",
        attribute: "profile",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data.addActressImage).toMatchObject({
        url: input.url,
        attribute: input.attribute,
      });

      const savedImage = await dataSource.getRepository(ActressImage).findOne({
        where: { url: input.url },
        relations: ["actress"],
      });

      expect(savedImage).toBeTruthy();
      expect(savedImage.url).toBe(input.url);
      expect(savedImage.attribute).toBe(input.attribute);
      expect(savedImage.actress.id).toBe(actress.id);
    });

    it("should fail to add an image if actress does not exist", async () => {
      const mutation = `
    mutation($input: AddActressImageInput!) {
      addActressImage(input: $input) {
        id
        url
        attribute
      }
    }
  `;

      const input = {
        actressId: 99999,
        url: "http://example.com/image.jpg",
        attribute: "profile",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data).toBeNull();
      expect(response.body.errors[0].message).toEqual(
        "Actress with ID 99999 not found"
      );
    });

    it("should update an existing actress image", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Update Image Actress",
      });

      const image = await dataSource.getRepository(ActressImage).save({
        url: "http://example.com/old.jpg",
        attribute: "profile",
        actress: actress,
      });

      const mutation = `
    mutation($input: UpdateActressImageInput!) {
      updateActressImage(input: $input) {
        id
        url
        attribute
      }
    }
  `;

      const input = {
        id: image.id,
        actressId: actress.id,
        url: "http://example.com/updated.jpg",
        attribute: "cover",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data.updateActressImage).toMatchObject({
        id: image.id,
        url: input.url,
        attribute: input.attribute,
      });

      const updatedImage = await dataSource
        .getRepository(ActressImage)
        .findOne({
          where: { id: image.id },
          relations: ["actress"],
        });
      expect(updatedImage.url).toBe(input.url);
      expect(updatedImage.attribute).toBe(input.attribute);
      expect(updatedImage.actress.id).toBe(actress.id);
    });

    it("should fail to update an image if it does not exist", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Nonexistent Image Actress",
      });

      const mutation = `
    mutation($input: UpdateActressImageInput!) {
      updateActressImage(input: $input) {
        id
        url
        attribute
      }
    }
  `;

      const input = {
        id: 99999,
        actressId: actress.id,
        url: "http://example.com/updated.jpg",
        attribute: "cover",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data).toBeNull();
      expect(response.body.errors[0].message).toEqual(
        `Image with ID ${input.id} not found for actress ${input.actressId}`
      );
    });

    it("should remove an existing actress image", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Remove Image Actress",
      });

      const image = await dataSource.getRepository(ActressImage).save({
        url: "http://example.com/remove.jpg",
        attribute: "profile",
        actress: actress,
      });

      const mutation = `
    mutation($input: RemoveActressImageInput!) {
      removeActressImage(input: $input)
    }
  `;

      const input = {
        id: image.id,
        actressId: actress.id,
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data.removeActressImage).toBe(true);

      const deletedImage = await dataSource
        .getRepository(ActressImage)
        .findOne({
          where: { id: image.id },
        });
      expect(deletedImage).toBeNull();
    });

    it("should fail to remove an image if it does not exist", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Nonexistent Remove Image Actress",
      });

      const mutation = `
    mutation($input: RemoveActressImageInput!) {
      removeActressImage(input: $input)
    }
  `;

      const input = {
        id: 99999,
        actressId: actress.id,
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query: mutation,
          variables: { input },
        })
        .expect(200);

      expect(response.body.data).toBeNull();
      expect(response.body.errors[0].message).toEqual(
        `Image with ID ${input.id} not found for actress ${input.actressId}`
      );
    });
  });

  describe("Database Constraints", () => {
    it("should enforce unique dmmId constraint", async () => {
      await dataSource.getRepository(Actress).save({
        name: "First Actress",
        dmmId: "duplicate123",
      });

      await expect(
        dataSource.getRepository(Actress).save({
          name: "Second Actress",
          dmmId: "duplicate123",
        })
      ).rejects.toThrow();
    });

    it("should allow null dmmId for multiple actresses", async () => {
      await dataSource.getRepository(Actress).save({
        name: "First Actress",
        dmmId: null,
      });

      await dataSource.getRepository(Actress).save({
        name: "Second Actress",
        dmmId: null,
      });

      const count = await dataSource.getRepository(Actress).count();
      expect(count).toBe(2);
    });
  });
});
