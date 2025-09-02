import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Series } from "src/v1/series/series.entity";
import { SeriesService } from "src/v1/series/series.service";

@Resolver(() => Series)
export class SeriesResolver {
  constructor(private readonly seriesService: SeriesService) {}

  @Query(() => [Series])
  seriesList() {
    return this.seriesService.findAll();
  }

  @Query(() => Series, { nullable: true })
  series(@Args("id", { type: () => Int }) id: number) {
    return this.seriesService.findOne(id);
  }

  @Mutation(() => Series)
  createSeries(@Args("name") name: string) {
    return this.seriesService.create({ name });
  }
}
