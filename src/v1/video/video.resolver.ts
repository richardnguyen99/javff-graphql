import { Resolver, Query, Args, ResolveField, Parent } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Video } from "src/v1/video/video.entity";
import { VideoService } from "src/v1/video/video.service";
import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";
import { VideoCover } from "src/v1/video/video-cover.entity";
import { VideoSampleImage } from "./video-sample-image.entity";
import { VideoCoverDimensions } from "./dto/video-cover.output";
import { VideoSampleImageDimensions } from "./dto/video-sample-image.output";

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

  @ResolveField(() => VideoCoverDimensions, { nullable: true })
  async covers(@Parent() video: Video): Promise<VideoCoverDimensions> {
    const qb = this.videoCoverRepository
      .createQueryBuilder("cover")
      .select(["cover.attribute", "cover.id", "cover.url"])
      .where("cover.video_id = :videoId", { videoId: video.id })
      .groupBy("cover.attribute, cover.id");

    const covers = await qb.getMany();
    const dimensions: VideoCoverDimensions = {};

    for (const cover of covers) {
      const attribute = cover.attribute.replace("_dvd", "");
      dimensions[attribute] = cover.url;
    }

    return dimensions;
  }

  @ResolveField(() => VideoSampleImageDimensions, { nullable: true })
  async sampleImages(
    @Parent() video: Video
  ): Promise<VideoSampleImageDimensions> {
    const qb = this.videoSampleImageRepository
      .createQueryBuilder("image")
      .select(["image.attribute as attribute", "array_agg(image.url) as urls"])
      .where("image.video_id = :videoId", { videoId: video.id })
      .groupBy("image.attribute");

    const images = await qb.getRawMany();
    const dimensions: VideoSampleImageDimensions = {};

    for (const image of images) {
      const attribute = image.attribute.replace("_dvd", "");
      dimensions[attribute] = image.urls;
    }

    return dimensions;
  }
}
