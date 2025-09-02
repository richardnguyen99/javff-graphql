import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Maker } from "src/v1/maker/maker.entity";
import { MakerResolver } from "src/v1/maker/maker.resolver";
import { MakerService } from "src/v1/maker/maker.service";

@Module({
  imports: [TypeOrmModule.forFeature([Maker])],
  providers: [MakerResolver, MakerService],
  exports: [TypeOrmModule],
})
export class MakerModule {}
