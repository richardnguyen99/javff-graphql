import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressService } from "src/v1/actress/actress.service";

@Resolver(() => Actress)
export class ActressResolver {
  constructor(private readonly actressService: ActressService) {}

  @Query(() => [Actress])
  actresses() {
    return this.actressService.findAll();
  }

  @Query(() => Actress, { nullable: true })
  actress(@Args("id", { type: () => Int }) id: number) {
    return this.actressService.findOne(id);
  }

  @Mutation(() => Actress)
  createActress(
    @Args("name") name: string,
    @Args("birthdate", { nullable: true }) birthdate?: string,
    @Args("profileImage", { nullable: true }) profileImage?: string
  ) {
    return this.actressService.create({ name, birthdate, profileImage });
  }
}
