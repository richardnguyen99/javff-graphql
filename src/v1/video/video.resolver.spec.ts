import { Test, TestingModule } from "@nestjs/testing";
import { VideoResolver } from "./video.resolver";
import { VideoService } from "./video.service";
import { VideoConnection } from "./dto/video-connection.output";
import { VideoQueryOptionsInput } from "./dto/video-query-options.input";
import { Video } from "./video.entity";

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

  it("videos should return a list of videos", async () => {
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

  it("videos should pass undefined if no options are provided", async () => {
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
});
