import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Video } from "src/v1/video/video.entity";
import { VideoResolver } from "src/v1/video/video.resolver";
import { VideoService } from "src/v1/video/video.service";
import { Genre } from "src/v1/video/genre.entity";

import { Actress } from "src/v1/actress/actress.entity";
import { Series } from "src/v1/series/series.entity";
import { Maker } from "src/v1/maker/maker.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Video, Actress, Series, Maker, Genre])],
  providers: [VideoResolver, VideoService],
  exports: [TypeOrmModule],
})
export class VideoModule {}
