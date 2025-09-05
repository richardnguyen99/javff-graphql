import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressService } from "src/v1/actress/actress.service";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";

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

  @Query(() => [Actress])
  async searchActressesByName(@Args("name") name: string) {
    return this.actressService.findByName(name);
  }

  @Query(() => Actress, { nullable: true })
  async actressByDmmId(@Args("dmmId") dmmId: string) {
    return this.actressService.findByDmmId(dmmId);
  }

  @Mutation(() => Actress)
  createActress(@Args("input") input: CreateActressInput) {
    return this.actressService.create(input);
  }

  @Mutation(() => Actress)
  updateActress(
    @Args("id", { type: () => Int }) id: number,
    @Args("input") input: UpdateActressInput
  ) {
    return this.actressService.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteActress(@Args("id", { type: () => Int }) id: number) {
    return this.actressService.delete(id);
  }
}
