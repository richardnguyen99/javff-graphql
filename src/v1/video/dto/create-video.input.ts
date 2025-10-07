import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class CreateVideoInput {
  @Field({ description: "The unique code of the video" })
  code: string;

  @Field({ nullable: true, description: "DMM ID (unique identifier, optional)" })
  dmmId?: string;

  @Field({ description: "The title of the video" })
  title: string;

  @Field({ nullable: true, description: "The description of the video" })
  description?: string;

  @Field({ nullable: true, description: "The label that the video belongs to" })
  label?: string;

  @Field({ nullable: true, description: "The release date of the video in ISO 8601" })
  releaseDate?: Date;

  @Field(() => Int, { nullable: true, description: "The length of the video in minutes" })
  length?: number;

  @Field(() => [Int], { nullable: true, description: "IDs of actresses in the video" })
  actressIds?: number[];

  @Field(() => [Int], { nullable: true, description: "IDs of genres for the video" })
  genreIds?: number[];

  @Field(() => Int, { nullable: true, description: "ID of the series the video belongs to" })
  seriesId?: number;

  @Field(() => Int, { nullable: true, description: "ID of the maker of the video" })
  makerId?: number;
}