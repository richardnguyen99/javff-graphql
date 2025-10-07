import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VideoService } from "src/v1/video/video.service";

import { Video } from "src/v1/video/video.entity";
import { VideoCover } from "src/v1/video/video-cover.entity";
import { VideoSampleImage } from "src/v1/video/video-sample-image.entity";
import { VideoSampleVideo } from "src/v1/video/video-sample-video.entity";

import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";
import { VideoCoverDimensions } from "src/v1/video/dto/video-cover.output";
import { VideoSampleImageDimensions } from "src/v1/video/dto/video-sample-image.output";
import { VideoSampleVideoDimensions } from "src/v1/video/dto/video-sample-video.output";
import { CreateVideoInput } from "src/v1/video/dto/create-video.input";

@Resolver(() => Video)
export class VideoResolver {
  private static readonly SAMPLE_VIDEO_MAP = {
    size_476_306: "list",
    size_560_360: "small",
    size_644_414: "medium",
    size_720_480: "large",
  };

  constructor(
    private readonly videoService: VideoService,
    @InjectRepository(VideoCover)
    private readonly videoCoverRepository: Repository<VideoCover>,
    @InjectRepository(VideoSampleImage)
    private readonly videoSampleImageRepository: Repository<VideoSampleImage>,
    @InjectRepository(VideoSampleVideo)
    private readonly videoSampleVideoRepository: Repository<VideoSampleVideo>
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

  @Mutation(() => Video, {
    description: "Create a new video entry.",
  })
  async createVideo(@Args("input") input: CreateVideoInput): Promise<Video> {
    return this.videoService.createVideo(input);
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

  @ResolveField(() => VideoSampleVideoDimensions, { nullable: true })
  async sampleVideos(
    @Parent() video: Video
  ): Promise<VideoSampleVideoDimensions> {
    const qb = this.videoSampleVideoRepository
      .createQueryBuilder("sampleVideo")
      .select(["sampleVideo.attribute as attribute", "sampleVideo.url as url"])
      .where("sampleVideo.video_id = :videoId", { videoId: video.id });

    const sampleVideos = await qb.getRawMany();
    const dimensions: VideoSampleVideoDimensions = {};

    for (const sampleVideo of sampleVideos) {
      const attribute = VideoResolver.SAMPLE_VIDEO_MAP[sampleVideo.attribute];
      dimensions[attribute] = sampleVideo.url;
    }

    return dimensions;
  }
}
