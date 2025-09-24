import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VideoService } from "src/v1/video/video.service";
import { Video } from "src/v1/video/video.entity";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";

describe("VideoService", () => {
  let service: VideoService;
  let repo: Repository<Video>;

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
    repo = module.get<Repository<Video>>(getRepositoryToken(Video));
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
      expect(andWhere).toHaveBeenCalled(); // Should be called for actress subquery
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
      expect(andWhere).toHaveBeenCalled(); // Should be called for actress subquery
      expect(result.edges.length).toBe(1);
      expect(result.edges[0].node).toEqual(mockVideo);
      expect(result.totalCount).toBe(1);
    });
  });
});
