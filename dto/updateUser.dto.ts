import * as yup from "yup";

export class UpdateUserDto {
  companyName?: string;
  email?: string;
  // phone?: string;

  static yupSchema() {
    return yup.object({
      companyName: yup.string().required("Please Enter Your Name").nullable(),
      email: yup.string().required("Please Enter Your Email").nullable(),
    });
  }
}
