import { InputType, Field } from "@nestjs/graphql";
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  IsISO8601,
} from "class-validator";

import { CreateActressImageInput } from "./create-actress-image.input";

@InputType()
export class CreateActressInput {
  @Field()
  @IsString({ message: "name must be a string" })
  @IsNotEmpty({ message: "name is required" })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "dmmId must be a string" })
  dmmId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "displayName must be a string" })
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "ruby must be a string" })
  ruby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: "bust must be a number",
    }
  )
  @Min(0, { message: "bust must be at least 0" })
  bust?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "cup must be a string" })
  cup?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: "waist must be a number",
    }
  )
  @Min(0, { message: "waist must be at least 0" })
  waist?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: "hip must be a number",
    }
  )
  @Min(0, { message: "hip must be at least 0" })
  hip?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: "height must be a number",
    }
  )
  @Min(0, { message: "height must be at least 0" })
  height?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601(
    {
      strict: true,
    },
    {
      message:
        "birthday must be a valid ISO 8601 date string such as YYYY-MM-DD",
    }
  )
  birthday?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "bloodType must be a string" })
  bloodType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "hobby must be a string" })
  hobby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "prefectures must be a string" })
  prefectures?: string;

  @Field(() => [CreateActressImageInput], { nullable: true })
  images?: CreateActressImageInput[];
}
