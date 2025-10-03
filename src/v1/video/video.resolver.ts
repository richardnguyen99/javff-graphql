import { Resolver, Query, Args, ResolveField, Parent } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Video } from "src/v1/video/video.entity";
import { VideoService } from "src/v1/video/video.service";
import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";
import { VideoCover } from "src/v1/video/video-cover.entity";
import { VideoSampleImage } from "./video-sample-image.entity";

@Resolver(() => Video)
export class VideoResolver {
  constructor(
    private readonly videoService: VideoService,
    @InjectRepository(VideoCover)
    private readonly videoCoverRepository: Repository<VideoCover>,
    @InjectRepository(VideoSampleImage)
    private readonly videoSampleImageRepository: Repository<VideoSampleImage>
  ) {}

  @Query(() => VideoConnection, {
    description: "Get a paginated list of videos with Relay-style pagination.",
  })
  async videos(
    @Args("options", { type: () => VideoQueryOptionsInput, nullable: true })
    options?: VideoQueryOptionsInput
  ): Promise<VideoConnection> {
    return this.videoService.findAllConnection(options);
  }

  @ResolveField(() => [VideoCover], { nullable: true })
  async covers(@Parent() video: Video): Promise<VideoCover[]> {
    return this.videoCoverRepository.find({
      where: { video: { id: video.id } },
    });
  }

  @ResolveField(() => [VideoSampleImage], { nullable: true })
  async sampleImages(@Parent() video: Video): Promise<VideoSampleImage[]> {
    return this.videoSampleImageRepository.find({
      where: { video: { id: video.id } },
      order: { attribute: "DESC", ordering: "ASC" },
    });
  }
}
