import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Maker } from "src/v1/maker/maker.entity";
import { MakerService } from "src/v1/maker/maker.service";

@Resolver(() => Maker)
export class MakerResolver {
  constructor(private readonly makerService: MakerService) {}

  @Query(() => [Maker])
  makers() {
    return this.makerService.findAll();
  }

  @Query(() => Maker, { nullable: true })
  maker(@Args("id", { type: () => Int }) id: number) {
    return this.makerService.findOne(id);
  }

  @Mutation(() => Maker)
  createMaker(@Args("name") name: string) {
    return this.makerService.create({ name });
  }
}
