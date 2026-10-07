/**
 * A refused request's messages, by the field each is about (FB2.28's form puts them beside its
 * fields): the backend's own error body lists them in `error.details`, FastAPI's handler in
 * `detail`, and both name a request field by where it sits in the body.
 */

import { ApiError } from "@/lib/api-client/core";
import { extractFieldErrors } from "@/lib/error-utils";

/** A 422 as the API client throws it: the answer's body is the error's context. */
const refused = (body: unknown) =>
  new ApiError(422, "Validation failed", "VALIDATION_FAILED", body);

describe("extractFieldErrors, the backend's error body", () => {
  it("reads a service's field errors", () => {
    const error = refused({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid amount",
        status_code: 422,
        details: [
          {
            field: "amount",
            message: "A whole number of credits from 1 to 100,000",
            code: "field_validation_error",
          },
        ],
      },
    });
    expect(extractFieldErrors(error)).toEqual({
      amount: "A whole number of credits from 1 to 100,000",
    });
  });

  it("names a request-model error by its field, not by where it sits in the body", () => {
    const error = refused({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Amount: Input should be less than or equal to 100000",
        details: [
          {
            field: "body -> amount",
            message: "Input should be less than or equal to 100000",
            code: "less_than_equal",
          },
          {
            field: "body -> reason",
            message: "String should have at least 3 characters",
            code: "string_too_short",
          },
        ],
      },
    });
    expect(extractFieldErrors(error)).toEqual({
      amount: "Input should be less than or equal to 100000",
      reason: "String should have at least 3 characters",
    });
  });

  it("leaves out a message about the whole body, which has no field", () => {
    const error = refused({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "A reset takes no amount",
        details: [
          {
            field: "body",
            message: "Value error, A reset takes no amount",
            code: "value_error",
          },
        ],
      },
    });
    expect(extractFieldErrors(error)).toEqual({});
  });

  it("keeps the first message for a field", () => {
    const error = refused({
      error: {
        details: [
          { field: "reason", message: "Between 3 and 500 characters" },
          { field: "reason", message: "A second complaint" },
        ],
      },
    });
    expect(extractFieldErrors(error)).toEqual({
      reason: "Between 3 and 500 characters",
    });
  });

  it("reads the details themselves, as a failure inside a 200 answer carries them", () => {
    // core.ts: `success: false` in an OK answer throws with `error.details` as the context.
    const error = new ApiError(422, "The expiry must be in the future", "X", [
      { field: "expires_at", message: "Must be in the future" },
    ]);
    expect(extractFieldErrors(error)).toEqual({
      expires_at: "Must be in the future",
    });
  });
});

describe("extractFieldErrors, FastAPI's own error body", () => {
  it("reads each entry's field from the end of its location", () => {
    const error = refused({
      detail: [
        {
          type: "greater_than_equal",
          loc: ["body", "amount"],
          msg: "Input should be greater than or equal to 1",
          input: 0,
        },
        {
          type: "string_too_long",
          loc: ["body", "reason"],
          msg: "String should have at most 500 characters",
        },
      ],
    });
    expect(extractFieldErrors(error)).toEqual({
      amount: "Input should be greater than or equal to 1",
      reason: "String should have at most 500 characters",
    });
  });

  it("leaves out a message about the whole body", () => {
    const error = refused({
      detail: [
        {
          type: "value_error",
          loc: ["body"],
          msg: "Value error, Only added credits can expire",
        },
      ],
    });
    expect(extractFieldErrors(error)).toEqual({});
  });
});

describe("extractFieldErrors, anything else", () => {
  it("finds no fields in an error with a plain message", () => {
    expect(
      extractFieldErrors(
        refused({ detail: "This plan has no monthly credits to reset to." }),
      ),
    ).toEqual({});
    expect(
      extractFieldErrors(
        new ApiError(403, "Super Admin accounts are protected"),
      ),
    ).toEqual({});
  });

  it("finds no fields in what isn't the API client's error", () => {
    expect(extractFieldErrors(new Error("Failed to fetch"))).toEqual({});
    expect(extractFieldErrors(null)).toEqual({});
    expect(extractFieldErrors("nope")).toEqual({});
  });
});
