export const nonBlankOrEmptyStringFormat = (field: string) =>
  `${field} must not neither be empty nor contain only whitespace`;

export const maxDecimalPlacesFormat = (field: string, places: number) =>
  `${field} should contain at most ${places} decimal places`;

export const gteFormat = (field: string, min: number) =>
  `${field} must be greater than or equal to  ${min}`;

export const lteFormat = (field: string, max: number) =>
  `${field} must be less than or equal to ${max}`;

export const isoFormat = (field: string) =>
  `${field} must be a valid ISO 8601 date string`;
