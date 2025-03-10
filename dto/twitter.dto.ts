import * as yup from "yup";

export class TwitterDto {
  twitterHandle?: string;
  userId?: string;

  static yupSchema() {
    return yup.object({
      twitterHandle: yup.string().required("Please Enter Your Twitter Handle").nullable(),
      userId: yup.string().required("Please Provide userId").nullable(),
    });
  }
}
