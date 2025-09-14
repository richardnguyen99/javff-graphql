import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeleteResult } from "typeorm";

import { ActressService } from "src/v1/actress/actress.service";
import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { ActressEdge, PageInfo } from "./dto/actress-connection.output"; // Add this import

const mockActressRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
});

const mockActressImageRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

describe("ActressService", () => {
  let service: ActressService;
  let actressRepository: jest.Mocked<Repository<Actress>>;
  let actressImageRepository: jest.Mocked<Repository<ActressImage>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActressService,
        {
          provide: getRepositoryToken(Actress),
          useFactory: mockActressRepository,
        },
        {
          provide: getRepositoryToken(ActressImage),
          useFactory: mockActressImageRepository,
        },
      ],
    }).compile();

    service = module.get<ActressService>(ActressService);
    actressRepository = module.get(getRepositoryToken(Actress));
    actressImageRepository = module.get(getRepositoryToken(ActressImage));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("findOne should return an actress by id", async () => {
    const result = { id: 1 } as Actress;
    actressRepository.findOne.mockResolvedValue(result);

    expect(await service.findOne(1)).toBe(result);
    expect(actressRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["videos", "images"],
    });
  });

  it("findByName should return actresses by name", async () => {
    type QB = {
      leftJoinAndSelect: jest.Mock;
      where: jest.Mock;
      orWhere: jest.Mock;
      getMany: jest.Mock;
    };

    const getMany = jest.fn().mockResolvedValue([{ id: 1 } as Actress]);
    const qb: QB = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany,
    };

    actressRepository.createQueryBuilder.mockReturnValue(qb as any);
    const result = await service.findByName("test");

    expect(result).toEqual([{ id: 1 }]);
    expect(qb.where).toHaveBeenCalled();
    expect(qb.orWhere).toHaveBeenCalled();
    expect(getMany).toHaveBeenCalled();
  });

  it("findByDmmId should return an actress by dmmId", async () => {
    const result = { id: 1 } as Actress;
    actressRepository.findOne.mockResolvedValue(result);

    expect(await service.findByDmmId("dmm123")).toBe(result);
    expect(actressRepository.findOne).toHaveBeenCalledWith({
      where: { dmmId: "dmm123" },
      relations: ["videos", "images"],
    });
  });

  it("create should create an actress and images", async () => {
    // Use CreateActressInput shape for input
    const createInput = {
      name: "test",
      images: [{ url: "img1", attribute: "main" }],
    };
    const actressData = { name: "test" } as Actress;
    const savedActress = { id: 1, name: "test" } as Actress;
    const images = createInput.images;
    const imageEntities = images.map(
      (img) =>
        ({
          id: 1,
          url: img.url,
          attribute: img.attribute,
          actress: savedActress,
        }) as ActressImage
    );

    actressRepository.create.mockReturnValue(actressData);
    actressRepository.save.mockResolvedValue(savedActress);
    actressImageRepository.create.mockImplementation(
      (img) =>
        ({
          id: 1,
          url: img.url,
          attribute: img.attribute,
          actress: savedActress,
        }) as ActressImage
    );
    actressImageRepository.save.mockResolvedValue(
      imageEntities as unknown as any
    );

    const result = await service.create(createInput);

    expect(result).toEqual({ ...savedActress, images: imageEntities });
    expect(actressRepository.create).toHaveBeenCalledWith({ name: "test" });
    expect(actressRepository.save).toHaveBeenCalledWith({ name: "test" });
    expect(actressImageRepository.create).toHaveBeenCalled();
    expect(actressImageRepository.save).toHaveBeenCalledWith(imageEntities);
  });

  it("update should update an actress", async () => {
    const data = { name: "updated" };
    const result = { id: 1, ...data } as Actress;

    actressRepository.save.mockResolvedValue(result);

    expect(await service.update(1, data)).toBe(result);
    expect(actressRepository.save).toHaveBeenCalledWith({ id: 1, ...data });
  });

  it("delete should remove an actress", async () => {
    const deleteResultTrue: DeleteResult = { affected: 1, raw: {} };
    const deleteResultFalse: DeleteResult = { affected: 0, raw: {} };

    actressRepository.delete.mockResolvedValue(deleteResultTrue);
    expect(await service.delete(1)).toBe(true);

    actressRepository.delete.mockResolvedValue(deleteResultFalse);
    expect(await service.delete(2)).toBe(false);
  });

  it("findAllConnection should return a relay-style connection", async () => {
    const mockActress = { id: 1, name: "Test", cup: "D" } as Actress;
    const mockEdges: ActressEdge[] = [
      { cursor: Buffer.from("1").toString("base64"), node: mockActress },
    ];
    const mockPageInfo: PageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: mockEdges[0].cursor,
      endCursor: mockEdges[0].cursor,
    };

    const getMany = jest.fn().mockResolvedValue([mockActress]);
    const getCount = jest.fn().mockResolvedValue(1);
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany,
      clone: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getCount,
    };

    actressRepository.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.findAllConnection({ first: 1 });

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].node).toEqual(mockActress);
    expect(result.pageInfo).toEqual(mockPageInfo);
    expect(result.totalCount).toBe(1);
  });

  it("findAllConnection should filter by cup, bust, waist, hip, and year", async () => {
    const mockActress = {
      id: 2,
      name: "Filtered",
      cup: "C",
      bust: 85,
      waist: 58,
      hip: 88,
      birthday: new Date("1989-05-01"),
    } as Actress;

    const getMany = jest.fn().mockResolvedValue([mockActress]);
    const getCount = jest.fn().mockResolvedValue(1);
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany,
      clone: jest.fn().mockReturnThis(),
      getCount,
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
    };

    actressRepository.createQueryBuilder.mockReturnValue(qb as any);

    const options = {
      cup: "C",
      bust: 85,
      waist: 58,
      hip: 88,
      year: 1990,
      first: 1,
    };

    const result = await service.findAllConnection(options);

    expect(qb.andWhere).toHaveBeenCalledWith("actress.cup = :cup", {
      cup: "C",
    });
    expect(qb.andWhere).toHaveBeenCalledWith("actress.bust >= :bust", {
      bust: 85,
    });
    expect(qb.andWhere).toHaveBeenCalledWith("actress.waist >= :waist", {
      waist: 58,
    });
    expect(qb.andWhere).toHaveBeenCalledWith("actress.hip >= :hip", {
      hip: 88,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      "EXTRACT(YEAR FROM actress.birthday) <= :year",
      { year: 1990 }
    );
    expect(result.edges[0].node).toEqual(mockActress);
  });
});
