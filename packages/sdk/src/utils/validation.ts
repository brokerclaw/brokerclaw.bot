import type { Address } from "viem";
import { isAddress } from "viem";
import type { CreateOfferParams, RequestQuoteParams, SubmitQuoteParams } from "../types.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateAddress(address: string, fieldName: string): Address {
  if (!isAddress(address)) {
    throw new ValidationError(`Invalid ${fieldName} address: ${address}`);
  }
  return address as Address;
}

export function validatePositiveAmount(amount: bigint, fieldName: string): void {
  if (amount <= 0n) {
    throw new ValidationError(`${fieldName} must be positive, got ${amount}`);
  }
}

export function validateDeadline(deadline: bigint): void {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (deadline <= now) {
    throw new ValidationError(
      `Deadline must be in the future. Got ${deadline}, current time ${now}`
    );
  }
}

export function validateBasisPoints(bps: bigint, fieldName: string): void {
  if (bps < 0n || bps > 10000n) {
    throw new ValidationError(`${fieldName} must be between 0 and 10000 bps, got ${bps}`);
  }
}

export function validateCreateOfferParams(params: CreateOfferParams): void {
  validateAddress(params.sellToken, "sellToken");
  validateAddress(params.buyToken, "buyToken");
  validatePositiveAmount(params.sellAmount, "sellAmount");
  validatePositiveAmount(params.buyAmount, "buyAmount");

  if (params.sellToken.toLowerCase() === params.buyToken.toLowerCase()) {
    throw new ValidationError("sellToken and buyToken must be different");
  }

  if (params.minFillPercent !== undefined) {
    validateBasisPoints(params.minFillPercent, "minFillPercent");
  }

  if (params.deadline !== undefined) {
    validateDeadline(params.deadline);
  }
}

export function validateRequestQuoteParams(params: RequestQuoteParams): void {
  validateAddress(params.sellToken, "sellToken");
  validateAddress(params.buyToken, "buyToken");
  validatePositiveAmount(params.sellAmount, "sellAmount");

  if (params.sellToken.toLowerCase() === params.buyToken.toLowerCase()) {
    throw new ValidationError("sellToken and buyToken must be different");
  }

  if (params.deadline !== undefined) {
    validateDeadline(params.deadline);
  }
}

export function validateSubmitQuoteParams(params: SubmitQuoteParams): void {
  validatePositiveAmount(params.buyAmount, "buyAmount");

  if (params.expiry !== undefined) {
    validateDeadline(params.expiry);
  }
}

export function validateOfferId(offerId: bigint): void {
  if (offerId < 0n) {
    throw new ValidationError(`Invalid offerId: ${offerId}`);
  }
}
