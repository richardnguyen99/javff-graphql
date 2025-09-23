import { Resolver, Query, Args } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";
import { VideoService } from "src/v1/video/video.service";
import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoService: VideoService) {}

  @Query(() => VideoConnection, {
    description: "Get a paginated list of videos with Relay-style pagination.",
  })
  async videos(
    @Args("options", { type: () => VideoQueryOptionsInput, nullable: true })
    options?: VideoQueryOptionsInput
  ): Promise<VideoConnection> {
    return this.videoService.findAllConnection(options);
  }
}
