import * as yup from "yup";

export class LoginDto {
  username?: string;
  password?: string;

  static yupSchema() {
    return yup.object({
      username: yup.string().required("Please Enter Your Email").nullable(),
      password: yup.string().min(8).required("Please Enter Your Password").nullable(),
    });
  }
}
