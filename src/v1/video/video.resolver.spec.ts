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

    it("should filter videos by multiple genre ids", async () => {
      const mockVideo: Video = { id: 4, title: "Multi Genre Video" } as Video;
      const mockEdge = {
        cursor: Buffer.from("4").toString("base64"),
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

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        first: 1,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by both actress ids and genre ids", async () => {
      const mockVideo1: Video = { id: 5, title: "Video 1" } as Video;
      const mockVideo2: Video = { id: 6, title: "Video 2" } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("5").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("6").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = {
        actressIds: ["123", "456"],
        genreIds: ["10", "20"],
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches both actress and genre filters", async () => {
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

      const options: VideoQueryOptionsInput = {
        actressIds: ["999"],
        genreIds: ["888"],
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by a given maker id", async () => {
      const mockVideo1: Video = {
        id: 1,
        title: "Maker Video 1",
        maker: { id: 1, dmmId: 1002, name: "Maker 1" },
        code: "code1",
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "Maker Video 2",
        maker: { id: 2, dmmId: 1003, name: "Maker 2" },
        code: "code2",
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = { makerId: "m1", first: 10 };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches the maker id", async () => {
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

      const options: VideoQueryOptionsInput = {
        makerId: "not-exist",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by a given series id", async () => {
      const mockSeries = { id: 101, name: "Legend Series" };
      const mockVideo1: Video = {
        id: 1,
        title: "Series Video 1",
        code: "S-001",
        series: mockSeries,
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "Series Video 2",
        code: "S-002",
        series: mockSeries,
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = { seriesId: "101", first: 10 };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches the series id", async () => {
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

      const options: VideoQueryOptionsInput = { seriesId: "999", first: 10 };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by both actress ids and a series id", async () => {
      const mockActress1 = { id: 21, name: "Actress Alpha" };
      const mockActress2 = { id: 22, name: "Actress Beta" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1: Video = {
        id: 1,
        title: "Epic Video 1",
        code: "E-001",
        actresses: [mockActress1, mockActress2],
        series: mockSeries,
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "Epic Video 2",
        code: "E-002",
        actresses: [mockActress1, mockActress2],
        series: mockSeries,
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = {
        actressIds: ["21", "22"],
        seriesId: "301",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches both actress ids and series id", async () => {
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

      const options: VideoQueryOptionsInput = {
        actressIds: ["21", "22"],
        seriesId: "999",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by both genre ids and a series id", async () => {
      const mockGenre1 = { id: 10, name: "Drama", dmmId: 1001 };
      const mockGenre2 = { id: 20, name: "Action", dmmId: 1002 };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1: Video = {
        id: 1,
        title: "Epic Genre Video 1",
        code: "EG-001",
        genres: [mockGenre1, mockGenre2],
        series: mockSeries,
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "Epic Genre Video 2",
        code: "EG-002",
        genres: [mockGenre1, mockGenre2],
        series: mockSeries,
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        seriesId: "301",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches both genre ids and series id", async () => {
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

      const options: VideoQueryOptionsInput = {
        genreIds: ["10", "20"],
        seriesId: "999",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by both a maker id and a series id", async () => {
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1: Video = {
        id: 1,
        title: "MakerSeries Video 1",
        code: "MS-001",
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "MakerSeries Video 2",
        code: "MS-002",
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = {
        makerId: "100",
        seriesId: "301",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches both maker id and series id", async () => {
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

      const options: VideoQueryOptionsInput = {
        makerId: "100",
        seriesId: "999",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should filter videos by actress ids, genre ids, maker id, and series id", async () => {
      const mockActress1 = { id: 11, name: "Actress One" };
      const mockActress2 = { id: 12, name: "Actress Two" };
      const mockGenre1 = { id: 10, name: "Drama", dmmId: 1001 };
      const mockGenre2 = { id: 20, name: "Action", dmmId: 1002 };
      const mockMaker = { id: 100, dmmId: 2001, name: "Studio Alpha" };
      const mockSeries = { id: 301, name: "Epic Saga" };

      const mockVideo1: Video = {
        id: 1,
        title: "All Filter Video 1",
        code: "ALL-001",
        actresses: [mockActress1, mockActress2],
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockVideo2: Video = {
        id: 2,
        title: "All Filter Video 2",
        code: "ALL-002",
        actresses: [mockActress1, mockActress2],
        genres: [mockGenre1, mockGenre2],
        maker: mockMaker,
        series: mockSeries,
      } as Video;
      const mockEdge1 = {
        cursor: Buffer.from("1").toString("base64"),
        node: mockVideo1,
      };
      const mockEdge2 = {
        cursor: Buffer.from("2").toString("base64"),
        node: mockVideo2,
      };
      const mockConnection: VideoConnection = {
        edges: [mockEdge1, mockEdge2],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: mockEdge1.cursor,
          endCursor: mockEdge2.cursor,
        },
        totalCount: 2,
      };

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        genreIds: ["10", "20"],
        makerId: "100",
        seriesId: "301",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });

    it("should return empty result if no video matches all filters", async () => {
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

      const options: VideoQueryOptionsInput = {
        actressIds: ["11", "12"],
        genreIds: ["10", "20"],
        makerId: "100",
        seriesId: "999",
        first: 10,
      };
      mockVideoService.findAllConnection.mockResolvedValue(mockConnection);

      const result = await resolver.videos(options);

      expect(service.findAllConnection).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockConnection);
    });
  });
});
