import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Series } from "./series.entity";

import { SeriesResolver } from "src/v1/series/series.resolver";
import { SeriesService } from "src/v1/series/series.service";

@Module({
  imports: [TypeOrmModule.forFeature([Series])],
  providers: [SeriesResolver, SeriesService],
  exports: [TypeOrmModule],
})
export class SeriesModule {}
