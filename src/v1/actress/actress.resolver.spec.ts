import { Test, TestingModule } from "@nestjs/testing";
import { ActressResolver } from "./actress.resolver";
import { ActressService } from "./actress.service";
import { CreateActressInput } from "./dto/create-actress.input";
import { UpdateActressInput } from "./dto/update-actress.input";
import { Actress } from "./actress.entity";

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
    await expect(resolver.actresses()).resolves.toEqual([mockActress]);

    expect(service.findAll).toHaveBeenCalled();
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
});
