import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Video } from "src/v1/video/video.entity";
import { VideoService } from "src/v1/video/video.service";

@Resolver(() => Video)
export class VideoResolver {
  constructor(private readonly videoService: VideoService) {}

  @Query(() => [Video])
  videos() {
    return this.videoService.findAll();
  }

  @Query(() => Video, { nullable: true })
  video(@Args("id", { type: () => Int }) id: number) {
    return this.videoService.findOne(id);
  }

  @Mutation(() => Video)
  createVideo(
    @Args("code") code: string,
    @Args("title") title: string,
    @Args("coverImage", { nullable: true }) coverImage?: string,
    @Args("releaseDate", { nullable: true }) releaseDate?: string
  ) {
    return this.videoService.create({ code, title, coverImage, releaseDate });
  }
}
