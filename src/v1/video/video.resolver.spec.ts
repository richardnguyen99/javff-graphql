import { Test, TestingModule } from "@nestjs/testing";

import { VideoResolver } from "src/v1/video/video.resolver";
import { VideoService } from "src/v1/video/video.service";
import { Video } from "src/v1/video/video.entity";

import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";

describe("VideoResolver", () => {
  let resolver: VideoResolver;
  let service: VideoService;

  const mockVideoService = {
    findAllConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoResolver,
        {
          provide: VideoService,
          useValue: mockVideoService,
        },
      ],
    }).compile();

    resolver = module.get<VideoResolver>(VideoResolver);
    service = module.get<VideoService>(VideoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });

  describe("videos query", () => {
    it("should return a list of videos", async () => {
      const mockVideo: Video = { id: 1, title: "Test Video" } as Video;
      const mockEdge = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge.cursor,
          endCursor: mockEdge.cursor,
        },
        totalCount: 1,
      };

      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const options: VideoQueryOptionsInput = { first: 1 };
      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should pass undefined if no options are provided", async () => {
      const mockConnection: VideoConnection = {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };

      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(undefined);

      expect(service.findAllConnection).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by a single actress id", async () => {
      const mockVideo: Video = { id: 2, title: "Actress Video" } as Video;
      const mockEdge = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge.cursor,
          endCursor: mockEdge.cursor,
        },
        totalCount: 1,
      };

      const options: VideoQueryOptionsInput = { actressIds: ["123"] };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by multiple actress ids", async () => {
      const mockVideo: Video = { id: 3, title: "Multi Actress Video" } as Video;
      const mockEdge = {
        cursor: Buffer.from("3").toString("base64"),
        node: mockVideo,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge.cursor,
          endCursor: mockEdge.cursor,
        },
        totalCount: 1,
      };

      const options: VideoQueryOptionsInput = { actressIds: ["123", "456"] };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });
  });
});
