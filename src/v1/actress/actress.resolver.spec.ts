import { Test, TestingModule } from "@nestjs/testing";
import { ActressResolver } from "./actress.resolver";
import { ActressService } from "./actress.service";
import { CreateActressInput } from "./dto/create-actress.input";
import { UpdateActressInput } from "./dto/update-actress.input";
import { Actress } from "./actress.entity";
import { ActressConnection } from "./dto/actress-connection.output"; // Add this import
import { ActressSortOrder } from "./dto/actress-query-options.input";

describe("ActressResolver", () => {
  let resolver: ActressResolver;
  let service: ActressService;

  const mockActress: Actress = {
    id: 1,
    name: "Test Actress",
    dmmId: "dmm123",
  };

  const mockActressService = {
    findAll: jest.fn().mockResolvedValue([mockActress]),
    findOne: jest.fn().mockResolvedValue(mockActress),
    findByName: jest.fn().mockResolvedValue([mockActress]),
    findByDmmId: jest.fn().mockResolvedValue(mockActress),
    findAllConnection: jest.fn().mockResolvedValue({
      edges: [
        {
          cursor: Buffer.from("1").toString("base64"),
          node: mockActress,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("1").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 1,
    } as ActressConnection),
    create: jest.fn().mockResolvedValue(mockActress),
    update: jest.fn().mockResolvedValue(mockActress),
    delete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActressResolver,
        { provide: ActressService, useValue: mockActressService },
      ],
    }).compile();

    resolver = module.get<ActressResolver>(ActressResolver);
    service = module.get<ActressService>(ActressService);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });

  it("should return all actresses", async () => {
    await expect(resolver.actresses()).resolves.toEqual({
      edges: [
        {
          cursor: Buffer.from("1").toString("base64"),
          node: mockActress,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("1").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 1,
    });

    expect(service.findAllConnection).toHaveBeenCalled();
  });

  it("should return an actress by id", async () => {
    await expect(resolver.actress(1)).resolves.toEqual(mockActress);

    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it("should search actresses by name", async () => {
    await expect(resolver.searchActressesByName("Test")).resolves.toEqual([
      mockActress,
    ]);

    expect(service.findByName).toHaveBeenCalledWith("Test");
  });

  it("should return an actress by dmmId", async () => {
    await expect(resolver.actressByDmmId("dmm123")).resolves.toEqual(
      mockActress
    );

    expect(service.findByDmmId).toHaveBeenCalledWith("dmm123");
  });

  it("should create an actress", async () => {
    const input: CreateActressInput = { name: "Test Actress" };
    await expect(resolver.createActress(input)).resolves.toEqual(mockActress);

    expect(service.create).toHaveBeenCalledWith(input);
  });

  it("should update an actress", async () => {
    const input: UpdateActressInput = { name: "Updated Actress" };
    await expect(resolver.updateActress(1, input)).resolves.toEqual(
      mockActress
    );

    expect(service.update).toHaveBeenCalledWith(1, input);
  });

  it("should delete an actress", async () => {
    await expect(resolver.deleteActress(1)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(1);
  });

  it("should return a relay-style connection for actresses", async () => {
    const mockConnection: ActressConnection = {
      edges: [
        {
          cursor: Buffer.from("1").toString("base64"),
          node: mockActress,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("1").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 1,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnection);

    await expect(resolver.actresses({ first: 1 })).resolves.toEqual(
      mockConnection
    );
    expect(service.findAllConnection).toHaveBeenCalledWith({ first: 1 });
  });

  it("should return actresses filtered by cup, bust, waist, hip, and year", async () => {
    const options = {
      cup: "C",
      bust: 85,
      waist: 58,
      hip: 88,
      year: 1990,
      first: 1,
    };

    const mockConnection: ActressConnection = {
      edges: [
        {
          cursor: Buffer.from("2").toString("base64"),
          node: {
            id: 2,
            name: "Filtered",
            cup: "C",
            bust: 85,
            waist: 58,
            hip: 88,
            birthday: new Date("1989-05-01"),
          } as Actress,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("2").toString("base64"),
      },
      totalCount: 1,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnection);

    await expect(resolver.actresses(options)).resolves.toEqual(mockConnection);
    expect(service.findAllConnection).toHaveBeenCalledWith(options);
  });

  it("should return a relay-style connection sorted by cup ASC and DESC, handling nulls", async () => {
    const actressNullCup = { id: 1, name: "NullCup", cup: null } as Actress;
    const actressCupA = { id: 2, name: "CupA", cup: "A" } as Actress;
    const actressCupD = { id: 3, name: "CupD", cup: "D" } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("2").toString("base64"), node: actressCupA },
        { cursor: Buffer.from("3").toString("base64"), node: actressCupD },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullCup },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("3").toString("base64"), node: actressCupD },
        { cursor: Buffer.from("2").toString("base64"), node: actressCupA },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullCup },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "cup",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "cup",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "cup",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "cup",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });

  it("should return a relay-style connection sorted by bust ASC and DESC, handling nulls", async () => {
    const actressNullBust = { id: 1, name: "NullBust", bust: null } as Actress;
    const actressBust80 = { id: 2, name: "Bust80", bust: 80 } as Actress;
    const actressBust100 = { id: 3, name: "Bust100", bust: 100 } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("2").toString("base64"), node: actressBust80 },
        { cursor: Buffer.from("3").toString("base64"), node: actressBust100 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullBust },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("3").toString("base64"), node: actressBust100 },
        { cursor: Buffer.from("2").toString("base64"), node: actressBust80 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullBust },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "bust",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "bust",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "bust",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "bust",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });

  it("should return a relay-style connection sorted by waist ASC and DESC, handling nulls", async () => {
    const actressNullWaist = {
      id: 1,
      name: "NullWaist",
      waist: null,
    } as Actress;
    const actressWaist58 = { id: 2, name: "Waist58", waist: 58 } as Actress;
    const actressWaist65 = { id: 3, name: "Waist65", waist: 65 } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("2").toString("base64"), node: actressWaist58 },
        { cursor: Buffer.from("3").toString("base64"), node: actressWaist65 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullWaist },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("3").toString("base64"), node: actressWaist65 },
        { cursor: Buffer.from("2").toString("base64"), node: actressWaist58 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullWaist },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "waist",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "waist",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "waist",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "waist",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });

  it("should return a relay-style connection sorted by hip ASC and DESC, handling nulls", async () => {
    const actressNullHip = { id: 1, name: "NullHip", hip: null } as Actress;
    const actressHip85 = { id: 2, name: "Hip85", hip: 85 } as Actress;
    const actressHip95 = { id: 3, name: "Hip95", hip: 95 } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("2").toString("base64"), node: actressHip85 },
        { cursor: Buffer.from("3").toString("base64"), node: actressHip95 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullHip },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("3").toString("base64"), node: actressHip95 },
        { cursor: Buffer.from("2").toString("base64"), node: actressHip85 },
        { cursor: Buffer.from("1").toString("base64"), node: actressNullHip },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "hip",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "hip",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "hip",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "hip",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });

  it("should return a relay-style connection sorted by height ASC and DESC, handling nulls", async () => {
    const actressNullHeight = {
      id: 1,
      name: "NullHeight",
      height: null,
    } as Actress;
    const actressHeight150 = {
      id: 2,
      name: "Height150",
      height: 150,
    } as Actress;
    const actressHeight170 = {
      id: 3,
      name: "Height170",
      height: 170,
    } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("2").toString("base64"), node: actressHeight150 },
        { cursor: Buffer.from("3").toString("base64"), node: actressHeight170 },
        {
          cursor: Buffer.from("1").toString("base64"),
          node: actressNullHeight,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        { cursor: Buffer.from("3").toString("base64"), node: actressHeight170 },
        { cursor: Buffer.from("2").toString("base64"), node: actressHeight150 },
        {
          cursor: Buffer.from("1").toString("base64"),
          node: actressNullHeight,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "height",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "height",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "height",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "height",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });

  it("should return a relay-style connection sorted by birthday ASC and DESC, handling nulls", async () => {
    const actressNullBirthday = {
      id: 1,
      name: "NullBirthday",
      birthday: null,
    } as Actress;
    const actressBirthday1990 = {
      id: 2,
      name: "Birthday1990",
      birthday: new Date("1990-01-01"),
    } as Actress;
    const actressBirthday1980 = {
      id: 3,
      name: "Birthday1980",
      birthday: new Date("1980-01-01"),
    } as Actress;

    const mockConnectionAsc: ActressConnection = {
      edges: [
        {
          cursor: Buffer.from("3").toString("base64"),
          node: actressBirthday1980,
        },
        {
          cursor: Buffer.from("2").toString("base64"),
          node: actressBirthday1990,
        },
        {
          cursor: Buffer.from("1").toString("base64"),
          node: actressNullBirthday,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("3").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    const mockConnectionDesc: ActressConnection = {
      edges: [
        {
          cursor: Buffer.from("2").toString("base64"),
          node: actressBirthday1990,
        },
        {
          cursor: Buffer.from("3").toString("base64"),
          node: actressBirthday1980,
        },
        {
          cursor: Buffer.from("1").toString("base64"),
          node: actressNullBirthday,
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: Buffer.from("2").toString("base64"),
        endCursor: Buffer.from("1").toString("base64"),
      },
      totalCount: 3,
    };

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionAsc);

    await expect(
      resolver.actresses({
        sortBy: "birthday",
        sortOrder: ActressSortOrder.ASC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionAsc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "birthday",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    service.findAllConnection = jest.fn().mockResolvedValue(mockConnectionDesc);

    await expect(
      resolver.actresses({
        sortBy: "birthday",
        sortOrder: ActressSortOrder.DESC,
        first: 10,
      })
    ).resolves.toEqual(mockConnectionDesc);
    expect(service.findAllConnection).toHaveBeenCalledWith({
      sortBy: "birthday",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });
  });
});
