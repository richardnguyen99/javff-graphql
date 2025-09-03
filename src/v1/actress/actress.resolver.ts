import {
  Resolver,
  Query,
  Args,
  Mutation,
  Int,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import translate from "translate";

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

  @ResolveField(() => String, {
    nullable: true,
    description: "Romanized version of the Japanese name (DeepL)",
  })
  async romajiName(@Parent() actress: Actress): Promise<string | null> {
    if (!actress.name) return null;

    translate.engine = "deepl";
    translate.key = process.env.DEEPL_KEY;

    try {
      const result = await translate(actress.name, { from: "ja", to: "en" });

      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
