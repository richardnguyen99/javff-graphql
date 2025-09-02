import { Module } from "@nestjs/common";

import { ActressModule } from "src/v1/actress/actress.module";
import { VideoModule } from "src/v1/video/video.module";
import { SeriesModule } from "src/v1/series/series.module";
import { MakerModule } from "src/v1/maker/maker.module";

@Module({
  imports: [ActressModule, VideoModule, SeriesModule, MakerModule],
})
export class V1Module {}
