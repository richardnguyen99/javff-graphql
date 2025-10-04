import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class VideoSampleVideoDimensions {
  @Field({ nullable: true, name: "size476x306" })
  list?: string;

  @Field({ nullable: true, name: "size560x360" })
  small?: string;

  @Field({ nullable: true, name: "size644x414" })
  medium?: string;

  @Field({ nullable: true, name: "size720x480" })
  large?: string;
}
