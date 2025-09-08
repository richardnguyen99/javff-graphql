import { InputType, Field } from "@nestjs/graphql";
import {
  IsOptional,
  IsNumber,
  Min,
  IsISO8601,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";

import { CreateActressImageInput } from "./create-actress-image.input";
import {
  gteFormat,
  isoFormat,
  maxDecimalPlacesFormat,
  nonBlankOrEmptyStringFormat,
} from "src/common/utils/error-formatter";

@InputType()
export class CreateActressInput {
  @Field()
  @Transform(({ value }) => value.trim())
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("name"),
  })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("dmmId"),
  })
  dmmId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, {
    message: nonBlankOrEmptyStringFormat("displayName"),
  })
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("ruby") })
  ruby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("bust", 2),
    }
  )
  @Min(1, { message: gteFormat("bust", 1) })
  bust?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("cup") })
  cup?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("waist", 2),
    }
  )
  @Min(1, { message: gteFormat("waist", 1) })
  waist?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("hip", 2),
    }
  )
  @Min(0, { message: gteFormat("hip", 0) })
  hip?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: maxDecimalPlacesFormat("height", 2),
    }
  )
  @Min(0, { message: gteFormat("height", 1) })
  height?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601(
    {
      strict: true,
    },
    {
      message: isoFormat("birthday"),
    }
  )
  birthday?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("bloodType") })
  bloodType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("hobby") })
  hobby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(1, { message: nonBlankOrEmptyStringFormat("prefectures") })
  prefectures?: string;

  @Field(() => [CreateActressImageInput], { nullable: true })
  images?: CreateActressImageInput[];
}
