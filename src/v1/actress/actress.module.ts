import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressResolver } from "src/v1/actress/actress.resolver";
import { ActressService } from "src/v1/actress/actress.service";

@Module({
  imports: [TypeOrmModule.forFeature([Actress])],
  providers: [ActressResolver, ActressService],
  exports: [TypeOrmModule],
})
export class ActressModule {}
