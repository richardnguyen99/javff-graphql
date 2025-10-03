import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class VideoCoverDimensions {
  @Field({ nullable: true })
  list?: string;

  @Field({ nullable: true })
  small?: string;

  @Field({ nullable: true })
  large?: string;
}
