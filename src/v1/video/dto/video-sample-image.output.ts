import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class VideoSampleImageDimensions {
  @Field(() => [String], { nullable: true })
  sample_s?: string[];

  @Field(() => [String], { nullable: true })
  sample_l?: string[];
}
