import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeleteResult } from "typeorm";

import { ActressService } from "src/v1/actress/actress.service";
import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { ActressEdge, PageInfo } from "./dto/actress-connection.output";
import { ActressSortOrder } from "./dto/actress-query-options.input";
import { NotFoundException } from "@nestjs/common";

function createQbMock(getMany: jest.Mock) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qb: any = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockImplementation(() => qb),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany,
    getCount: jest.fn().mockResolvedValue(3),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
  };

  return qb;
}

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

    actressRepository.createQueryBuilder.mockReturnValue(qb as never);
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
    actressImageRepository.save.mockResolvedValue(imageEntities as never);

    const result = await service.create(createInput);

    expect(result).toEqual({ ...savedActress, images: imageEntities });
    expect(actressRepository.create).toHaveBeenCalledWith({ name: "test" });
    expect(actressRepository.save).toHaveBeenCalledWith({ name: "test" });
    expect(actressImageRepository.create).toHaveBeenCalled();
    expect(actressImageRepository.save).toHaveBeenCalledWith(imageEntities);
  });

  it("update should update an actress using query builder and return the updated actress", async () => {
    const data = { name: "updated" };
    const qbMock = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const updatedActress = { id: 1, name: "updated" } as Actress;

    actressRepository.createQueryBuilder.mockReturnValue(qbMock as never);
    actressRepository.findOne.mockResolvedValue(updatedActress);

    const result = await service.update(1, data);

    expect(qbMock.update).toHaveBeenCalled();
    expect(qbMock.set).toHaveBeenCalledWith(data);
    expect(qbMock.where).toHaveBeenCalledWith("id = :id", { id: 1 });
    expect(qbMock.execute).toHaveBeenCalled();
    expect(actressRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toBe(updatedActress);
  });

  it("update should throw NotFoundException if actress does not exist", async () => {
    const data = { name: "notfound" };
    const qbMock = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    actressRepository.createQueryBuilder.mockReturnValue(qbMock as never);

    await expect(service.update(1, data)).rejects.toThrow(
      new NotFoundException("Actress with ID 1 not found")
    );
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

    actressRepository.createQueryBuilder.mockReturnValue(qb as never);

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

    actressRepository.createQueryBuilder.mockReturnValue(qb as never);

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

  it("findAllConnection should sort by cup ASC and DESC, handling nulls", async () => {
    const actressNullCup = { id: 1, name: "NullCup", cup: null } as Actress;
    const actressCupA = { id: 2, name: "CupA", cup: "A" } as Actress;
    const actressCupD = { id: 3, name: "CupD", cup: "D" } as Actress;

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([actressCupA, actressCupD, actressNullCup]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([actressCupD, actressCupA, actressNullCup]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "cup",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressCupA,
      actressCupD,
      actressNullCup,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "cup",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressCupD,
      actressCupA,
      actressNullCup,
    ]);
  });

  it("findAllConnection should sort by bust ASC and DESC, handling nulls", async () => {
    const actressNullBust = { id: 1, name: "NullBust", bust: null } as Actress;
    const actressBust80 = { id: 2, name: "Bust80", bust: 80 } as Actress;
    const actressBust100 = { id: 3, name: "Bust100", bust: 100 } as Actress;

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([actressBust80, actressBust100, actressNullBust]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([actressBust100, actressBust80, actressNullBust]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "bust",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });
    expect(result.edges.map((e) => e.node)).toEqual([
      actressBust80,
      actressBust100,
      actressNullBust,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "bust",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressBust100,
      actressBust80,
      actressNullBust,
    ]);
  });

  it("findAllConnection should sort by waist ASC and DESC, handling nulls", async () => {
    const actressNullWaist = {
      id: 1,
      name: "NullWaist",
      waist: null,
    } as Actress;
    const actressWaist58 = { id: 2, name: "Waist58", waist: 58 } as Actress;
    const actressWaist65 = { id: 3, name: "Waist65", waist: 65 } as Actress;

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([actressWaist58, actressWaist65, actressNullWaist]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([actressWaist65, actressWaist58, actressNullWaist]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "waist",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressWaist58,
      actressWaist65,
      actressNullWaist,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "waist",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressWaist65,
      actressWaist58,
      actressNullWaist,
    ]);
  });

  it("findAllConnection should sort by hip ASC and DESC, handling nulls", async () => {
    const actressNullHip = { id: 1, name: "NullHip", hip: null } as Actress;
    const actressHip85 = { id: 2, name: "Hip85", hip: 85 } as Actress;
    const actressHip95 = { id: 3, name: "Hip95", hip: 95 } as Actress;

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([actressHip85, actressHip95, actressNullHip]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([actressHip95, actressHip85, actressNullHip]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "hip",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressHip85,
      actressHip95,
      actressNullHip,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "hip",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressHip95,
      actressHip85,
      actressNullHip,
    ]);
  });

  it("findAllConnection should sort by height ASC and DESC, handling nulls", async () => {
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

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([
        actressHeight150,
        actressHeight170,
        actressNullHeight,
      ]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([
        actressHeight170,
        actressHeight150,
        actressNullHeight,
      ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "height",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressHeight150,
      actressHeight170,
      actressNullHeight,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "height",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressHeight170,
      actressHeight150,
      actressNullHeight,
    ]);
  });

  it("findAllConnection should sort by birthday ASC and DESC, handling nulls", async () => {
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

    const getManyAsc = jest
      .fn()
      .mockResolvedValue([
        actressBirthday1980,
        actressBirthday1990,
        actressNullBirthday,
      ]);
    const getManyDesc = jest
      .fn()
      .mockResolvedValue([
        actressBirthday1990,
        actressBirthday1980,
        actressNullBirthday,
      ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyAsc)
    );
    let result = await service.findAllConnection({
      sortBy: "birthday",
      sortOrder: ActressSortOrder.ASC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressBirthday1980,
      actressBirthday1990,
      actressNullBirthday,
    ]);

    actressRepository.createQueryBuilder.mockReturnValue(
      createQbMock(getManyDesc)
    );
    result = await service.findAllConnection({
      sortBy: "birthday",
      sortOrder: ActressSortOrder.DESC,
      first: 10,
    });

    expect(result.edges.map((e) => e.node)).toEqual([
      actressBirthday1990,
      actressBirthday1980,
      actressNullBirthday,
    ]);
  });
});
