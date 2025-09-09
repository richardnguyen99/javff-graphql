import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

import { TestSetup } from "./test-setup";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    await TestSetup.setupTestContainer();
    app = await TestSetup.setupTestApp();
  }, 60000);

  afterAll(async () => {
    await TestSetup.cleanup();
  }, 30000);

  it("should have GraphQL endpoint available", async () => {
    const query = `
      query {
        __schema {
          types {
            name
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post("/graphql")
      .send({ query })
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.data.__schema).toBeDefined();
      });
  });
});
