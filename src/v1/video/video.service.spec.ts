import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

import { VideoService } from "src/v1/video/video.service";
import { Video } from "src/v1/video/video.entity";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";

describe("VideoService", () => {
  let service: VideoService;

  const mockVideo = { id: 1, title: "Test Video" } as Video;

  const mockRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: getRepositoryToken(Video),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAllConnection", () => {
    it("should return a list of actresses", async () => {
      const getMany = jest.fn().mockResolvedValue([mockVideo]);
      const getCount = jest.fn().mockResolvedValue(1);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { first: 1 };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(leftJoinAndSelect).toHaveBeenCalledWith(
        "video.actresses",
        "actress"
      );
      expect(leftJoinAndSelect).toHaveBeenCalledWith("video.series", "series");
      expect(leftJoinAndSelect).toHaveBeenCalledWith("video.maker", "maker");
      expect(leftJoinAndSelect).toHaveBeenCalledWith("video.genres", "genre");
      expect(orderBy).toHaveBeenCalled();
      expect(take).toHaveBeenCalled();
      expect(getMany).toHaveBeenCalled();
      expect(getCount).toHaveBeenCalled();

      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.totalCount).toBe(1);
    });

    it("should handle empty results", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { first: 1 };
      const result = await service.findAllConnection(options);

      expect(result.edges.length).toBe(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by a single actress id", async () => {
      const getMany = jest.fn().mockResolvedValue([mockVideo]);
      const getCount = jest.fn().mockResolvedValue(1);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { actressIds: ["123"], first: 1 };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalled();
      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.totalCount).toBe(1);
    });

    it("should filter videos by multiple actress ids", async () => {
      const getMany = jest.fn().mockResolvedValue([mockVideo]);
      const getCount = jest.fn().mockResolvedValue(1);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["123", "456"],
        first: 1,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalled();
      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.totalCount).toBe(1);
    });

    it("should filter videos by a single genre id", async () => {
      const getMany = jest.fn().mockResolvedValue([mockVideo]);
      const getCount = jest.fn().mockResolvedValue(1);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { genreIds: ["10"], first: 1 };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalled();
      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.totalCount).toBe(1);
    });

    it("should filter videos by multiple genre ids", async () => {
      const getMany = jest.fn().mockResolvedValue([mockVideo]);
      const getCount = jest.fn().mockResolvedValue(1);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        first: 1,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalled();
      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.totalCount).toBe(1);
    });

    it("should filter videos by both actress ids and genre ids", async () => {
      const mockVideo1 = { id: 1, title: "Video 1" } as Video;
      const mockVideo2 = { id: 2, title: "Video 2" } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["123", "456"],
        genreIds: ["10", "20"],
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalled();
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both actress and genre filters", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["999"],
        genreIds: ["888"],
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by a given maker id", async () => {
      const mockVideo1 = {
        id: 1,
        title: "Maker Video 1",
        maker: { id: 1, dmmId: 1002, name: "Maker 1" },
        code: "code1",
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Maker Video 2",
        maker: { id: 2, dmmId: 1003, name: "Maker 2" },
        code: "code2",
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { makerId: "m1", first: 10 };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "m1",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches the maker id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        makerId: "not-exist",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "not-exist",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by both actress ids and a maker id", async () => {
      const mockActress1 = { id: 11, name: "Actress One" };
      const mockActress2 = { id: 12, name: "Actress Two" };
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };

      const mockVideo1 = {
        id: 1,
        title: "Video 1",
        code: "A-001",
        actresses: [mockActress1, mockActress2],
        maker: mockMaker,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Video 2",
        code: "A-002",
        actresses: [mockActress1, mockActress2],
        maker: mockMaker,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        makerId: "100",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both actress ids and maker id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        makerId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by both genre ids and a maker id", async () => {
      const mockGenre1 = { id: 10, name: "Drama", dmmId: 1001 };
      const mockGenre2 = { id: 20, name: "Action", dmmId: 1002 };
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };

      const mockVideo1 = {
        id: 1,
        title: "Video 1",
        code: "G-001",
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Video 2",
        code: "G-002",
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        makerId: "100",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both genre ids and maker id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        makerId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by a given series id", async () => {
      const mockSeries = { id: 101, name: "Legend Series" };
      const mockVideo1 = {
        id: 1,
        title: "Series Video 1",
        code: "S-001",
        series: mockSeries,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Series Video 2",
        code: "S-002",
        series: mockSeries,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { seriesId: "101", first: 10 };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "101",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches the series id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = { seriesId: "999", first: 10 };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by both actress ids and a series id", async () => {
      const mockActress1 = { id: 21, name: "Actress Alpha" };
      const mockActress2 = { id: 22, name: "Actress Beta" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1 = {
        id: 1,
        title: "Epic Video 1",
        code: "E-001",
        actresses: [mockActress1, mockActress2],
        series: mockSeries,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Epic Video 2",
        code: "E-002",
        actresses: [mockActress1, mockActress2],
        series: mockSeries,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["21", "22"],
        seriesId: "301",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "301",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both actress ids and series id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["21", "22"],
        seriesId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by both genre ids and a series id", async () => {
      const mockGenre1 = { id: 10, name: "Drama", dmmId: 1001 };
      const mockGenre2 = { id: 20, name: "Action", dmmId: 1002 };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1 = {
        id: 1,
        title: "Epic Genre Video 1",
        code: "EG-001",
        genres: [mockGenre1, mockGenre2],
        series: mockSeries,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "Epic Genre Video 2",
        code: "EG-002",
        genres: [mockGenre1, mockGenre2],
        series: mockSeries,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        seriesId: "301",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "301",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both genre ids and series id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        seriesId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by both a maker id and a series id", async () => {
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1 = {
        id: 1,
        title: "MakerSeries Video 1",
        code: "MS-001",
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "MakerSeries Video 2",
        code: "MS-002",
        maker: mockMaker,
        series: mockSeries,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        makerId: "100",
        seriesId: "301",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "301",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches both maker id and series id", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        makerId: "100",
        seriesId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it("should filter videos by actress ids, genre ids, maker id, and series id", async () => {
      const mockActress1 = { id: 11, name: "Actress One" };
      const mockActress2 = { id: 12, name: "Actress Two" };
      const mockGenre1 = { id: 10, name: "Drama", dmmId: 1001 };
      const mockGenre2 = { id: 20, name: "Action", dmmId: 1002 };
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1 = {
        id: 1,
        title: "All Filter Video 1",
        code: "ALL-001",
        actresses: [mockActress1, mockActress2],
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockVideo2 = {
        id: 2,
        title: "All Filter Video 2",
        code: "ALL-002",
        actresses: [mockActress1, mockActress2],
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
        series: mockSeries,
      } as Video;

      const getMany = jest.fn().mockResolvedValue([mockVideo1, mockVideo2]);
      const getCount = jest.fn().mockResolvedValue(2);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        genreIds: ["10", "20"],
        makerId: "100",
        seriesId: "301",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("video");
      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "301",
      });
      expect(result.edges.length).toBe(2);
      expect(result.edges[0].node).toEqual(mockVideo1);
      expect(result.edges[1].node).toEqual(mockVideo2);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty result if no video matches all filters", async () => {
      const getMany = jest.fn().mockResolvedValue([]);
      const getCount = jest.fn().mockResolvedValue(0);
      const orderBy = jest.fn().mockReturnThis();
      const take = jest.fn().mockReturnThis();
      const andWhere = jest.fn().mockReturnThis();
      const leftJoinAndSelect = jest.fn().mockReturnThis();
      const clone = jest.fn().mockReturnValue({
        getCount,
      });
      const select = jest.fn().mockReturnThis();
      const innerJoin = jest.fn().mockReturnThis();
      const where = jest.fn().mockReturnThis();
      const groupBy = jest.fn().mockReturnThis();
      const having = jest.fn().mockReturnThis();
      const getQuery = jest.fn().mockReturnValue("subquery");
      const setParameters = jest.fn().mockReturnValue({});
      const getParameters = jest.fn().mockReturnValue({});

      const qb = {
        leftJoinAndSelect,
        orderBy,
        take,
        andWhere,
        getMany,
        clone,
        select,
        innerJoin,
        where,
        groupBy,
        having,
        getQuery,
        setParameters,
        getParameters,
      };

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        genreIds: ["10", "20"],
        makerId: "100",
        seriesId: "999",
        first: 10,
      };
      const result = await service.findAllConnection(options);

      expect(andWhere).toHaveBeenCalledWith("maker.id = :makerId", {
        makerId: "100",
      });
      expect(andWhere).toHaveBeenCalledWith("series.id = :seriesId", {
        seriesId: "999",
      });
      expect(result.edges.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
