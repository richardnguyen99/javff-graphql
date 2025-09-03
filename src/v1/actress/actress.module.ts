import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { ActressResolver } from "src/v1/actress/actress.resolver";
import { ActressService } from "src/v1/actress/actress.service";

@Module({
  imports: [TypeOrmModule.forFeature([Actress, ActressImage])],
  providers: [ActressService, ActressResolver],
  exports: [ActressService],
})
export class ActressModule {}
