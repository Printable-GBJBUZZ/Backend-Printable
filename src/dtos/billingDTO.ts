import { IsNumber, IsString, IsNotEmpty, IsObject } from "https://esm.sh/class-validator@0.14.0";

export class PaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class PayoutDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @IsObject()
  @IsNotEmpty()
  accountDetails: {
    accountNumber: string;
    ifsc: string;
    name: string;
  };
}

export class ReferralDTO {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  referrerId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}