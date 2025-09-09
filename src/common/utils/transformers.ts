import { Transform } from "class-transformer";

type TransformFn = Parameters<typeof Transform>[0];

export const strictTrimTransformer: TransformFn = ({ value }) => {
  if (typeof value !== "string") {
    throw new Error(`Expected a string. Received ${value} (${typeof value})`);
  }

  return value.trim();
};

export const safeTrimTransformer: TransformFn = ({ value }) =>
  typeof value === "string" ? value.trim() : value;
