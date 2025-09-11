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
    it("should fetch all actresses", async () => {
      const actress = await dataSource.getRepository(Actress).save({
        name: "Test Actress",
        displayName: "Test Display Name",
        dmmId: "test123",
      });

      const query = `
        query {
          actresses {
            id
            name
            displayName
            dmmId
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.actresses).toHaveLength(1);
      expect(response.body.data.actresses[0]).toMatchObject({
        id: actress.id.toString(),
        name: "Test Actress",
        displayName: "Test Display Name",
        dmmId: "test123",
      });
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
        // name is missing
        displayName: "No Name",
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
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
      expect(JSON.stringify(response.body.errors)).toMatch(/name/);
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

    it("should fail if bust is negative", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { id }
            }
          `;
      const input = { name: "Test", bust: -5 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);
      expect(JSON.stringify(response.body.errors)).toMatch(/bust/);
    });

    it("should fail if bust is negative", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { id }
            }
          `;

      const input = { name: "Test", bust: -5 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);
      expect(JSON.stringify(response.body.errors)).toMatch(/bust/);
    });

    it("should fail if images is not an array", async () => {
      const mutation = `
        mutation($input: CreateActressInput!) {
          createActress(input: $input) {
            id
            name
            images {
              id
              url
            }
          }
        }
      `;

      const input = {
        name: "Invalid Images",
        images: "not-an-array", // invalid type
      };

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(JSON.stringify(response.body.errors)).toMatch(/images/);
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
      expect(JSON.stringify(response.body.errors)).toMatch(/dmmId/);
    });

    it("should fail if displayName is blank", async () => {
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
      expect(JSON.stringify(response.body.errors)).toMatch(/displayName/);
    });

    it("should fail if ruby is a number", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { id }
            }
          `;
      const input = { name: "Test", ruby: 123 };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);
      expect(JSON.stringify(response.body.errors)).toMatch(/ruby/);
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

    it("should fail if hip is negative", async () => {
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

      expect(JSON.stringify(response.body.errors)).toMatch(/hip/);
    });

    it("should fail if height is a string", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { id }
            }
          `;
      const input = { name: "Test", height: "tall" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toBeDefined();
      expect(response.body.errors[0].message).toEqual(
        'Variable "$input" got invalid value "tall" at "input.height"; Float cannot represent non numeric value: "tall"'
      );
    });

    it("should fail if birthday is not ISO8601", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { id }
            }
          `;

      const input = { name: "Test", birthday: "31-12-2000" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(JSON.stringify(response.body.errors)).toMatch(/birthday/);
    });

    it("should fail if bloodType is blank", async () => {
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

      expect(JSON.stringify(response.body.errors)).toMatch(/bloodType/);
    });

    it("should fail if hobby is blank", async () => {
      const mutation = `
            mutation($input: CreateActressInput!) {
              createActress(input: $input) { 
                id 
                name
                dmmId
                hobby
              }
            }
          `;

      const input = { name: "Test", dmmId: "123", hobby: "" };
      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query: mutation, variables: { input } })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(JSON.stringify(response.body.errors)).toMatch(/hobby/);
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
