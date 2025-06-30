import Twilio from "twilio";

export const accountSid = "ACc4356a52c5ff57ff74f55a5fd8545156";
export const authToken = "8bee49030735c1d33e246bdafec16af3";
export const verifySid = "VA7558483884915392f5f011d526286b69";

export const twilioClient = Twilio(accountSid, authToken);
